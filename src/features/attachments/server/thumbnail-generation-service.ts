import "server-only";

import {
  AttachmentThumbnailStatus,
  AttachmentType,
} from "@prisma/client";
import { logger } from "@trigger.dev/sdk";

import { prisma } from "@/db/client";
import { buildThumbnailStorageKeyFromOriginal } from "@/features/attachments/lib/build-thumbnail-storage-key";
import { isAllowedAttachmentMimeType } from "@/features/attachments/lib/allowed-mime-types";
import { truncateThumbnailGenerationError } from "@/features/attachments/lib/truncate-thumbnail-error";
import { generateImageThumbnail } from "@/features/attachments/server/image-processor";
import { assertWorkspaceHasStorageCapacity } from "@/features/attachments/server/assert-workspace-storage";
import { getWorkspaceStorageFields } from "@/features/attachments/server/public-attachment-availability";
import { getStorageProvider } from "@/features/attachments/server/storage";

export type GenerateAttachmentThumbnailInput = {
  attachmentId: string;
  workspaceId: string;
  attempt: number;
};

export type GenerateAttachmentThumbnailResult =
  | { outcome: "skipped"; reason: string }
  | { outcome: "generated" }
  | { outcome: "failed"; retryable: boolean };

async function markThumbnailFailed(input: {
  attachmentId: string;
  errorMessage: string;
}): Promise<void> {
  await prisma.estimateAttachment.update({
    where: { id: input.attachmentId },
    data: {
      thumbnailStatus: AttachmentThumbnailStatus.FAILED,
      thumbnailGenerationError: truncateThumbnailGenerationError(input.errorMessage),
    },
  });
}

export async function generateAttachmentThumbnail(
  input: GenerateAttachmentThumbnailInput,
): Promise<GenerateAttachmentThumbnailResult> {
  const attachment = await prisma.estimateAttachment.findFirst({
    where: { id: input.attachmentId, workspaceId: input.workspaceId },
    select: {
      id: true,
      estimateId: true,
      attachmentType: true,
      mimeType: true,
      originalFileName: true,
      storageKey: true,
      thumbnailStorageKey: true,
      thumbnailStatus: true,
    },
  });

  if (!attachment) {
    logger.info("Thumbnail generation skipped — attachment not found", {
      attachmentId: input.attachmentId,
      attempt: input.attempt,
    });
    return { outcome: "skipped", reason: "not_found" };
  }

  if (attachment.attachmentType !== AttachmentType.IMAGE) {
    return { outcome: "skipped", reason: "not_image" };
  }

  if (
    attachment.thumbnailStatus === AttachmentThumbnailStatus.GENERATED &&
    attachment.thumbnailStorageKey
  ) {
    logger.info("Thumbnail generation skipped — already generated", {
      attachmentId: attachment.id,
      estimateId: attachment.estimateId,
      thumbnailStatus: attachment.thumbnailStatus,
      attempt: input.attempt,
    });
    return { outcome: "skipped", reason: "already_generated" };
  }

  await prisma.estimateAttachment.update({
    where: { id: attachment.id },
    data: {
      thumbnailStatus: AttachmentThumbnailStatus.PROCESSING,
      thumbnailGenerationError: null,
    },
  });

  logger.info("Thumbnail generation started", {
    attachmentId: attachment.id,
    estimateId: attachment.estimateId,
    thumbnailStatus: AttachmentThumbnailStatus.PROCESSING,
    attempt: input.attempt,
  });

  try {
    if (!isAllowedAttachmentMimeType(attachment.mimeType)) {
      throw new Error(`Unsupported image mime type: ${attachment.mimeType}`);
    }

    const storage = getStorageProvider();
    const originalBuffer = await storage.download(attachment.storageKey);
    const { thumbnailBuffer, storedBytes: thumbnailStoredBytes } = await generateImageThumbnail(
      originalBuffer,
      attachment.mimeType,
    );

    const workspace = await getWorkspaceStorageFields(input.workspaceId);

    if (!workspace) {
      throw new Error("Workspace not found.");
    }

    try {
      assertWorkspaceHasStorageCapacity(workspace, thumbnailStoredBytes);
    } catch (quotaError) {
      const message =
        quotaError instanceof Error ? quotaError.message : "Workspace storage limit reached.";

      await markThumbnailFailed({
        attachmentId: attachment.id,
        errorMessage: message,
      });

      logger.error("Thumbnail generation failed", {
        attachmentId: attachment.id,
        estimateId: attachment.estimateId,
        thumbnailStatus: AttachmentThumbnailStatus.FAILED,
        error: message,
        attempt: input.attempt,
      });

      return { outcome: "failed", retryable: false };
    }

    const thumbnailStorageKey = buildThumbnailStorageKeyFromOriginal(attachment.storageKey);
    const thumbUpload = await storage.upload({
      key: thumbnailStorageKey,
      customId: `${attachment.id}-thumb`,
      body: thumbnailBuffer,
      mimeType: attachment.mimeType,
      fileName: `thumb-${attachment.originalFileName}`,
    });

    await prisma.$transaction(async (tx) => {
      await tx.estimateAttachment.update({
        where: { id: attachment.id },
        data: {
          thumbnailStorageKey: thumbUpload.key,
          thumbnailStatus: AttachmentThumbnailStatus.GENERATED,
          thumbnailGenerationError: null,
          fileSizeBytes: {
            increment: BigInt(thumbnailStoredBytes),
          },
        },
      });

      await tx.workspace.update({
        where: { id: input.workspaceId },
        data: {
          attachmentStorageUsedBytes: {
            increment: BigInt(thumbnailStoredBytes),
          },
        },
      });
    });

    logger.info("Thumbnail generation completed", {
      attachmentId: attachment.id,
      estimateId: attachment.estimateId,
      thumbnailStatus: AttachmentThumbnailStatus.GENERATED,
      attempt: input.attempt,
    });

    return { outcome: "generated" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    await markThumbnailFailed({
      attachmentId: attachment.id,
      errorMessage: message,
    });

    logger.error("Thumbnail generation failed", {
      attachmentId: attachment.id,
      estimateId: attachment.estimateId,
      thumbnailStatus: AttachmentThumbnailStatus.FAILED,
      error: message,
      attempt: input.attempt,
    });

    return { outcome: "failed", retryable: true };
  }
}

export async function generateAttachmentThumbnailBatch(input: {
  workspaceId: string;
  attachmentIds: string[];
  attempt: number;
}): Promise<void> {
  let shouldRethrow = false;

  for (const attachmentId of input.attachmentIds) {
    const result = await generateAttachmentThumbnail({
      attachmentId,
      workspaceId: input.workspaceId,
      attempt: input.attempt,
    });

    if (result.outcome === "failed" && result.retryable) {
      shouldRethrow = true;
    }
  }

  if (shouldRethrow) {
    throw new Error("One or more attachment thumbnails failed with retryable errors.");
  }
}
