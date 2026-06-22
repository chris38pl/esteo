import "server-only";

import { RequestStagingAttachmentStatus, type Prisma } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

import { prisma } from "@/db/client";
import { isStagingExpired } from "@/features/attachments/lib/staging-ttl";
import { StagingAttachmentError } from "@/features/attachments/server/staging-attachment-errors";
import { StorageQuotaError } from "@/features/attachments/server/storage-errors";
import {
  buildIssueStagingStorageKey,
  deleteStorageKeys,
  prepareStagingFileBuffers,
  uploadBlobToStorage,
} from "@/features/attachments/server/upload-service";
import { ALLOWED_IMAGE_MIME_TYPES } from "@/features/attachments/lib/allowed-mime-types";
import { assertSingleFileSize } from "@/features/attachments/server/assert-workspace-storage";

const MAX_ISSUE_SCREENSHOTS = 10;
const ACTIVE_STATUSES: RequestStagingAttachmentStatus[] = ["UPLOADING", "PENDING", "FAILED"];

export type IssueStagingUploadResult = {
  attachmentId: string;
  status: "UPLOADING" | "PENDING" | "FAILED";
  error?: string;
};

function resolveIssueImageMimeType(
  file: File,
): (typeof ALLOWED_IMAGE_MIME_TYPES)[number] | null {
  if ((ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "jpg" || extension === "jpeg") {
    return "image/jpeg";
  }

  if (extension === "png") {
    return "image/png";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  return null;
}

function assertIssueImageFile(file: File) {
  assertSingleFileSize(file.size);

  if (!resolveIssueImageMimeType(file)) {
    throw new StorageQuotaError("Only JPEG, PNG, and WebP images are allowed.", "FILE_TOO_LARGE");
  }
}

async function assertOwnerIssueStagingLimits(uploadedById: string, additionalFileCount = 1) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const rows = await prisma.issueStagingAttachment.findMany({
    where: {
      uploadedById,
      status: { in: ACTIVE_STATUSES },
      createdAt: { gte: cutoff },
    },
    select: { id: true },
  });

  if (rows.length + additionalFileCount > MAX_ISSUE_SCREENSHOTS) {
    throw new StorageQuotaError(
      `Cannot attach more than ${MAX_ISSUE_SCREENSHOTS} screenshots.`,
      "BATCH_FILE_COUNT",
    );
  }
}

async function findOwnedIssueStagingAttachment(input: {
  attachmentId: string;
  uploadedById: string;
}) {
  const row = await prisma.issueStagingAttachment.findFirst({
    where: {
      id: input.attachmentId,
      uploadedById: input.uploadedById,
    },
  });

  if (!row) {
    throw new StagingAttachmentError("Staging attachment not found.", "NOT_FOUND");
  }

  return row;
}

async function executeIssueStagingUpload(input: {
  uploadedById: string;
  attachmentId: string;
  file: File;
}): Promise<IssueStagingUploadResult> {
  assertIssueImageFile(input.file);

  let prepared: Awaited<ReturnType<typeof prepareStagingFileBuffers>>;

  try {
    prepared = await prepareStagingFileBuffers(input.file, input.attachmentId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";

    await prisma.issueStagingAttachment.update({
      where: { id: input.attachmentId },
      data: {
        status: RequestStagingAttachmentStatus.FAILED,
        lastError: message,
        fileSizeBytes: BigInt(input.file.size),
      },
    });

    return {
      attachmentId: input.attachmentId,
      status: "FAILED",
      error: message,
    };
  }

  const storageKey = buildIssueStagingStorageKey(
    input.uploadedById,
    input.attachmentId,
    prepared.originalFileName,
  );

  const uploadItem = { ...prepared, storageKey };

  try {
    const uploaded = await uploadBlobToStorage(uploadItem);

    await prisma.issueStagingAttachment.update({
      where: { id: input.attachmentId },
      data: {
        status: RequestStagingAttachmentStatus.PENDING,
        storageKey: uploaded.storageKey,
        mimeType: prepared.mimeType,
        fileSizeBytes: BigInt(prepared.storedBytes),
        imageWidth: prepared.imageWidth,
        imageHeight: prepared.imageHeight,
        lastError: null,
      },
    });

    return {
      attachmentId: input.attachmentId,
      status: "PENDING",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";

    await deleteStorageKeys([storageKey]).catch(() => undefined);

    await prisma.issueStagingAttachment.update({
      where: { id: input.attachmentId },
      data: {
        status: RequestStagingAttachmentStatus.FAILED,
        lastError: message,
        storageKey: null,
        fileSizeBytes: BigInt(prepared.storedBytes),
      },
    });

    return {
      attachmentId: input.attachmentId,
      status: "FAILED",
      error: message,
    };
  }
}

export async function uploadIssueStagingAttachment(input: {
  uploadedById: string;
  file: File;
  retryAttachmentId?: string;
}): Promise<IssueStagingUploadResult> {
  if (input.retryAttachmentId) {
    const existing = await findOwnedIssueStagingAttachment({
      attachmentId: input.retryAttachmentId,
      uploadedById: input.uploadedById,
    });

    if (isStagingExpired(existing.createdAt)) {
      throw new StagingAttachmentError("Staging attachment expired.", "EXPIRED");
    }

    if (existing.status !== RequestStagingAttachmentStatus.FAILED) {
      throw new StagingAttachmentError("Attachment is not in failed state.", "INVALID_STATUS");
    }

    await prisma.issueStagingAttachment.update({
      where: { id: existing.id },
      data: {
        status: RequestStagingAttachmentStatus.UPLOADING,
        lastError: null,
        originalFileName: input.file.name,
        fileSizeBytes: BigInt(input.file.size),
      },
    });

    return executeIssueStagingUpload({
      uploadedById: input.uploadedById,
      attachmentId: existing.id,
      file: input.file,
    });
  }

  await assertOwnerIssueStagingLimits(input.uploadedById);

  const attachmentId = createId();

  await prisma.issueStagingAttachment.create({
    data: {
      id: attachmentId,
      uploadedById: input.uploadedById,
      status: RequestStagingAttachmentStatus.UPLOADING,
      originalFileName: input.file.name,
      fileSizeBytes: BigInt(input.file.size),
    },
  });

  return executeIssueStagingUpload({
    uploadedById: input.uploadedById,
    attachmentId,
    file: input.file,
  });
}

export async function deleteIssueStagingAttachment(input: {
  uploadedById: string;
  attachmentId: string;
}): Promise<void> {
  const row = await findOwnedIssueStagingAttachment(input);

  if (row.status === RequestStagingAttachmentStatus.LINKED) {
    throw new StagingAttachmentError("Attachment is already linked.", "INVALID_STATUS");
  }

  if (row.storageKey) {
    await deleteStorageKeys([row.storageKey]).catch(() => undefined);
  }

  await prisma.issueStagingAttachment.delete({
    where: { id: row.id },
  });
}

export async function linkIssueStagingAttachmentsInTx(
  tx: Prisma.TransactionClient,
  input: {
    issueId: string;
    uploadedById: string;
    attachmentIds: string[];
    baseSortOrder?: number;
  },
): Promise<void> {
  const uniqueIds = [...new Set(input.attachmentIds)];

  if (uniqueIds.length === 0) {
    return;
  }

  const issue = await tx.issue.findUnique({
    where: { id: input.issueId },
    select: {
      id: true,
      reportedById: true,
      _count: { select: { attachments: true } },
    },
  });

  if (!issue) {
    throw new Error("Issue not found.");
  }

  if (issue.reportedById !== input.uploadedById) {
    throw new StagingAttachmentError("Forbidden.", "FORBIDDEN");
  }

  if (issue._count.attachments + uniqueIds.length > MAX_ISSUE_SCREENSHOTS) {
    throw new StorageQuotaError(
      `Issue cannot have more than ${MAX_ISSUE_SCREENSHOTS} screenshots.`,
      "FILE_TOO_LARGE",
    );
  }

  const rows = await tx.issueStagingAttachment.findMany({
    where: {
      id: { in: uniqueIds },
      uploadedById: input.uploadedById,
    },
  });

  if (rows.length !== uniqueIds.length) {
    throw new StagingAttachmentError("Staging attachment not found.", "NOT_FOUND");
  }

  const baseSortOrder = input.baseSortOrder ?? issue._count.attachments;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];

    if (row.status !== RequestStagingAttachmentStatus.PENDING) {
      throw new StagingAttachmentError("Attachment is not ready for submit.", "INVALID_STATUS");
    }

    if (!row.storageKey || !row.mimeType) {
      throw new StagingAttachmentError("Attachment is missing storage key.", "INVALID_STATUS");
    }

    if (isStagingExpired(row.createdAt)) {
      throw new StagingAttachmentError("Staging attachment expired.", "EXPIRED");
    }

    await tx.issueAttachment.create({
      data: {
        id: row.id,
        issueId: input.issueId,
        storageKey: row.storageKey,
        originalFileName: row.originalFileName,
        mimeType: row.mimeType,
        fileSizeBytes: row.fileSizeBytes,
        sortOrder: baseSortOrder + index,
      },
    });

    await tx.issueStagingAttachment.delete({
      where: { id: row.id },
    });
  }
}
