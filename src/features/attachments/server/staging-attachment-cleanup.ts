import "server-only";

import { RequestStagingAttachmentStatus } from "@prisma/client";

import { prisma } from "@/db/client";
import {
  isStagingExpired,
  isStagingUploadingZombie,
} from "@/features/attachments/lib/staging-ttl";
import { deleteStorageKeys } from "@/features/attachments/server/upload-service";
import { decrementWorkspaceStorageUsed } from "@/features/attachments/server/usage-service";

export type StagingCleanupResult = {
  tier1Deleted: number;
  tier2BlobDeleted: number;
  tier2RowDeleted: number;
  failedRowDeleted: number;
};

export async function cleanupOrphanStagingAttachments(): Promise<StagingCleanupResult> {
  const now = Date.now();
  const result: StagingCleanupResult = {
    tier1Deleted: 0,
    tier2BlobDeleted: 0,
    tier2RowDeleted: 0,
    failedRowDeleted: 0,
  };

  const zombieCutoff = new Date(now - 60 * 60 * 1000);
  const zombies = await prisma.requestStagingAttachment.findMany({
    where: {
      status: RequestStagingAttachmentStatus.UPLOADING,
      storageKey: null,
      updatedAt: { lt: zombieCutoff },
    },
    select: { id: true },
  });

  if (zombies.length > 0) {
    const deleted = await prisma.requestStagingAttachment.deleteMany({
      where: { id: { in: zombies.map((row) => row.id) } },
    });
    result.tier1Deleted = deleted.count;
  }

  const expiredPending = await prisma.requestStagingAttachment.findMany({
    where: {
      status: RequestStagingAttachmentStatus.PENDING,
      storageKey: { not: null },
    },
    select: {
      id: true,
      workspaceId: true,
      storageKey: true,
      fileSizeBytes: true,
      createdAt: true,
    },
  });

  for (const row of expiredPending) {
    if (!isStagingExpired(row.createdAt, now)) {
      continue;
    }

    if (row.storageKey) {
      await deleteStorageKeys([row.storageKey]);
      await decrementWorkspaceStorageUsed(row.workspaceId, Number(row.fileSizeBytes));
      result.tier2BlobDeleted += 1;
    }

    await prisma.requestStagingAttachment.delete({ where: { id: row.id } });
    result.tier2RowDeleted += 1;
  }

  const expiredFailed = await prisma.requestStagingAttachment.findMany({
    where: {
      status: RequestStagingAttachmentStatus.FAILED,
    },
    select: { id: true, createdAt: true, storageKey: true, workspaceId: true, fileSizeBytes: true },
  });

  for (const row of expiredFailed) {
    if (!isStagingExpired(row.createdAt, now)) {
      continue;
    }

    if (row.storageKey) {
      await deleteStorageKeys([row.storageKey]);
      await decrementWorkspaceStorageUsed(row.workspaceId, Number(row.fileSizeBytes));
    }

    await prisma.requestStagingAttachment.delete({ where: { id: row.id } });
    result.failedRowDeleted += 1;
  }

  return result;
}

export { isStagingUploadingZombie };
