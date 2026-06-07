import "server-only";

import { AttachmentThumbnailStatus } from "@prisma/client";

import {
  getAttachmentById,
  listAttachmentsForEstimateCleanup,
} from "@/features/attachments/server/attachments-repository";
import { getStorageProvider } from "@/features/attachments/server/storage";
import { syncEstimateAttachmentCount } from "@/features/attachments/server/sync-attachment-count";
import { decrementWorkspaceStorageUsed } from "@/features/attachments/server/usage-service";

function thumbnailKeysForCleanup(attachment: {
  storageKey: string;
  thumbnailStorageKey: string | null;
  thumbnailStatus: AttachmentThumbnailStatus;
}): string[] {
  const keys = [attachment.storageKey];

  if (
    attachment.thumbnailStorageKey &&
    attachment.thumbnailStatus === AttachmentThumbnailStatus.GENERATED
  ) {
    keys.push(attachment.thumbnailStorageKey);
  }

  return keys;
}

export async function cleanupAttachmentsForEstimate(estimateId: string): Promise<void> {
  const attachments = await listAttachmentsForEstimateCleanup(estimateId);

  if (attachments.length === 0) {
    return;
  }

  const storage = getStorageProvider();
  const keys = attachments.flatMap((attachment) => thumbnailKeysForCleanup(attachment));

  await storage.delete(keys);

  const bytesByWorkspace = new Map<string, number>();

  for (const attachment of attachments) {
    const current = bytesByWorkspace.get(attachment.workspaceId) ?? 0;
    bytesByWorkspace.set(
      attachment.workspaceId,
      current + Number(attachment.fileSizeBytes),
    );
  }

  const { prisma } = await import("@/db/client");

  await prisma.$transaction(async (tx) => {
    for (const [workspaceId, bytes] of bytesByWorkspace) {
      await decrementWorkspaceStorageUsed(workspaceId, bytes, tx);
    }

    await tx.estimateAttachment.deleteMany({
      where: { estimateId },
    });

    await syncEstimateAttachmentCount(estimateId, tx);
  });
}

export async function deleteEstimateAttachment(input: {
  attachmentId: string;
  workspaceId: string;
}): Promise<void> {
  const attachment = await getAttachmentById(input.attachmentId, input.workspaceId);

  if (!attachment) {
    throw new Error("Attachment not found.");
  }

  const storage = getStorageProvider();
  const keys = thumbnailKeysForCleanup(attachment);

  await storage.delete(keys);

  const { prisma } = await import("@/db/client");

  await prisma.$transaction(async (tx) => {
    await tx.estimateAttachment.delete({
      where: { id: input.attachmentId, workspaceId: input.workspaceId },
    });

    await decrementWorkspaceStorageUsed(
      input.workspaceId,
      Number(attachment.fileSizeBytes),
      tx,
    );

    await syncEstimateAttachmentCount(attachment.estimateId, tx);
  });
}
