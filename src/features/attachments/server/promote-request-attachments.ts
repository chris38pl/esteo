import "server-only";

import {
  AttachmentThumbnailStatus,
  AttachmentUploadSource,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/db/client";
import {
  getStoredRequestAttachments,
  parseRequestAttachmentRecords,
  type RequestAttachmentRecord,
} from "@/features/attachments/lib/request-attachment-metadata";
import { enqueueAttachmentThumbnailGeneration } from "@/features/attachments/server/enqueue-attachment-thumbnails";
import { syncEstimateAttachmentCount } from "@/features/attachments/server/sync-attachment-count";

export async function promoteRequestAttachmentsToEstimate(input: {
  estimateRequestId: string;
  estimateId: string;
  workspaceId: string;
  uploadSource: AttachmentUploadSource;
  uploadedById: string | null;
}): Promise<{ promotedCount: number; promotedImageAttachmentIds: string[] }> {
  const request = await prisma.estimateRequest.findFirst({
    where: { id: input.estimateRequestId, workspaceId: input.workspaceId },
    select: { attachments: true, aiMetadata: true },
  });

  if (!request) {
    throw new Error("Estimate request not found.");
  }

  const records = parseRequestAttachmentRecords(request.attachments);
  const pending = getStoredRequestAttachments(records);

  if (pending.length === 0) {
    return { promotedCount: 0, promotedImageAttachmentIds: [] };
  }

  const existingIds = new Set(
    (
      await prisma.estimateAttachment.findMany({
        where: { estimateId: input.estimateId },
        select: { id: true },
      })
    ).map((row) => row.id),
  );

  const now = new Date().toISOString();
  let promotedCount = 0;
  const promotedImageAttachmentIds: string[] = [];

  await prisma.$transaction(async (tx) => {
    for (const record of pending) {
      if (existingIds.has(record.id)) {
        continue;
      }

      const isImage = record.attachmentType === "IMAGE";

      await tx.estimateAttachment.create({
        data: {
          id: record.id,
          estimateId: input.estimateId,
          workspaceId: input.workspaceId,
          uploadedById: input.uploadedById,
          uploadSource: input.uploadSource,
          attachmentType: record.attachmentType,
          originalFileName: record.originalFileName,
          mimeType: record.mimeType,
          fileSizeBytes: BigInt(record.fileSizeBytes),
          storageKey: record.storageKey,
          thumbnailStorageKey: null,
          thumbnailStatus: isImage
            ? AttachmentThumbnailStatus.PENDING
            : AttachmentThumbnailStatus.NOT_APPLICABLE,
          imageWidth: record.imageWidth ?? null,
          imageHeight: record.imageHeight ?? null,
        },
      });

      promotedCount += 1;

      if (isImage) {
        promotedImageAttachmentIds.push(record.id);
      }
    }

    const updatedRecords: RequestAttachmentRecord[] = records.map((record) => {
      if (
        record.status === "stored" &&
        !record.promotedAt &&
        pending.some((item) => item.id === record.id)
      ) {
        return { ...record, promotedAt: now };
      }

      return record;
    });

    const priorMetadata =
      request.aiMetadata && typeof request.aiMetadata === "object"
        ? (request.aiMetadata as Record<string, unknown>)
        : {};

    await tx.estimateRequest.update({
      where: { id: input.estimateRequestId },
      data: {
        attachments: updatedRecords as unknown as Prisma.InputJsonValue,
        aiMetadata: {
          ...priorMetadata,
          attachmentsPromotionStatus: "COMPLETED",
          attachmentsPromotionCompletedAt: now,
        },
      },
    });

    await syncEstimateAttachmentCount(input.estimateId, tx);
  });

  await enqueueAttachmentThumbnailGeneration({
    workspaceId: input.workspaceId,
    attachmentIds: promotedImageAttachmentIds,
  });

  return { promotedCount, promotedImageAttachmentIds };
}

export async function markAttachmentsPromotionFailed(input: {
  estimateRequestId: string;
  errorMessage: string;
}): Promise<void> {
  const request = await prisma.estimateRequest.findUnique({
    where: { id: input.estimateRequestId },
    select: { aiMetadata: true },
  });

  if (!request) {
    return;
  }

  const priorMetadata =
    request.aiMetadata && typeof request.aiMetadata === "object"
      ? (request.aiMetadata as Record<string, unknown>)
      : {};

  await prisma.estimateRequest.update({
    where: { id: input.estimateRequestId },
    data: {
      aiMetadata: {
        ...priorMetadata,
        attachmentsPromotionStatus: "FAILED",
        attachmentsPromotionError: input.errorMessage,
        attachmentsPromotionFailedAt: new Date().toISOString(),
      },
    },
  });
}
