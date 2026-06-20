import "server-only";

import {
  AttachmentUploadSource,
  RequestStagingAttachmentStatus,
  type Prisma,
} from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

import { prisma } from "@/db/client";
import {
  assertRequestAttachmentFileCount,
} from "@/features/attachments/lib/assert-request-attachment-limits";
import type { RequestAttachmentRecord } from "@/features/attachments/lib/request-attachment-metadata";
import { isStagingExpired } from "@/features/attachments/lib/staging-ttl";
import { assertWorkspaceHasStorageCapacity } from "@/features/attachments/server/assert-workspace-storage";
import { getWorkspaceStorageFields } from "@/features/attachments/server/public-attachment-availability";
import {
  assertOwnerStagingLimits,
  findActiveStagingAttachment,
} from "@/features/attachments/server/staging-attachment-limits";
import { StagingAttachmentError } from "@/features/attachments/server/staging-attachment-errors";
import { StorageQuotaError } from "@/features/attachments/server/storage-errors";
import {
  buildStagingStorageKey,
  deleteStorageKeys,
  prepareStagingFileBuffers,
  uploadBlobToStorage,
} from "@/features/attachments/server/upload-service";
import { incrementWorkspaceStorageUsed } from "@/features/attachments/server/usage-service";

export type StagingOwner =
  | { publicFingerprint: string }
  | { uploadedById: string };

export type StagingUploadResult = {
  attachmentId: string;
  status: "UPLOADING" | "PENDING" | "FAILED";
  error?: string;
};

function ownerData(owner: StagingOwner) {
  return "publicFingerprint" in owner
    ? { publicFingerprint: owner.publicFingerprint, uploadedById: null }
    : { publicFingerprint: null, uploadedById: owner.uploadedById };
}

function stagingRowToRequestRecord(
  row: Prisma.RequestStagingAttachmentGetPayload<object>,
): RequestAttachmentRecord {
  return {
    id: row.id,
    originalFileName: row.originalFileName,
    mimeType: row.mimeType ?? "application/octet-stream",
    attachmentType: row.attachmentType ?? "PDF",
    fileSizeBytes: Number(row.fileSizeBytes),
    storageKey: row.storageKey ?? "",
    imageWidth: row.imageWidth,
    imageHeight: row.imageHeight,
    status: "stored",
  };
}

async function executeStagingUpload(input: {
  workspaceId: string;
  uploadSource: AttachmentUploadSource;
  owner: StagingOwner;
  attachmentId: string;
  file: File;
}): Promise<StagingUploadResult> {
  const workspace = await getWorkspaceStorageFields(input.workspaceId);

  if (!workspace) {
    throw new StagingAttachmentError("Workspace not found.", "WORKSPACE_NOT_FOUND");
  }

  let prepared: Awaited<ReturnType<typeof prepareStagingFileBuffers>>;

  try {
    prepared = await prepareStagingFileBuffers(input.file, input.attachmentId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";

    await prisma.requestStagingAttachment.update({
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

  const storageKey = buildStagingStorageKey(
    input.workspaceId,
    input.attachmentId,
    prepared.originalFileName,
  );

  try {
    assertWorkspaceHasStorageCapacity(workspace, prepared.storedBytes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Storage limit reached.";

    await prisma.requestStagingAttachment.update({
      where: { id: input.attachmentId },
      data: {
        status: RequestStagingAttachmentStatus.FAILED,
        lastError: message,
        fileSizeBytes: BigInt(prepared.storedBytes),
      },
    });

    return {
      attachmentId: input.attachmentId,
      status: "FAILED",
      error: message,
    };
  }

  const uploadItem = { ...prepared, storageKey };

  try {
    const uploaded = await uploadBlobToStorage(uploadItem);

    await prisma.requestStagingAttachment.update({
      where: { id: input.attachmentId },
      data: {
        status: RequestStagingAttachmentStatus.PENDING,
        storageKey: uploaded.storageKey,
        attachmentType: prepared.attachmentType,
        mimeType: prepared.mimeType,
        fileSizeBytes: BigInt(prepared.storedBytes),
        imageWidth: prepared.imageWidth,
        imageHeight: prepared.imageHeight,
        lastError: null,
      },
    });

    await incrementWorkspaceStorageUsed(input.workspaceId, prepared.storedBytes);

    return {
      attachmentId: input.attachmentId,
      status: "PENDING",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";

    await deleteStorageKeys([storageKey]).catch(() => undefined);

    await prisma.requestStagingAttachment.update({
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

export async function uploadStagingAttachment(input: {
  workspaceId: string;
  uploadSource: AttachmentUploadSource;
  owner: StagingOwner;
  file: File;
  retryAttachmentId?: string;
}): Promise<StagingUploadResult> {
  const ownerFields = ownerData(input.owner);

  if (input.retryAttachmentId) {
    const existing = await findActiveStagingAttachment({
      attachmentId: input.retryAttachmentId,
      workspaceId: input.workspaceId,
      owner: input.owner,
    });

    if (isStagingExpired(existing.createdAt)) {
      throw new StagingAttachmentError("Staging attachment expired.", "EXPIRED");
    }

    if (existing.status !== RequestStagingAttachmentStatus.FAILED) {
      throw new StagingAttachmentError("Attachment is not in failed state.", "INVALID_STATUS");
    }

    await prisma.requestStagingAttachment.update({
      where: { id: existing.id },
      data: {
        status: RequestStagingAttachmentStatus.UPLOADING,
        lastError: null,
        originalFileName: input.file.name,
        fileSizeBytes: BigInt(input.file.size),
      },
    });

    return executeStagingUpload({
      workspaceId: input.workspaceId,
      uploadSource: input.uploadSource,
      owner: input.owner,
      attachmentId: existing.id,
      file: input.file,
    });
  }

  await assertOwnerStagingLimits({
    workspaceId: input.workspaceId,
    owner: input.owner,
    additionalBytes: input.file.size,
  });

  const attachmentId = createId();

  await prisma.requestStagingAttachment.create({
    data: {
      id: attachmentId,
      workspaceId: input.workspaceId,
      status: RequestStagingAttachmentStatus.UPLOADING,
      uploadSource: input.uploadSource,
      originalFileName: input.file.name,
      fileSizeBytes: BigInt(input.file.size),
      ...ownerFields,
    },
  });

  return executeStagingUpload({
    workspaceId: input.workspaceId,
    uploadSource: input.uploadSource,
    owner: input.owner,
    attachmentId,
    file: input.file,
  });
}

export async function deleteStagingAttachment(input: {
  workspaceId: string;
  attachmentId: string;
  owner: StagingOwner;
}): Promise<void> {
  const row = await findActiveStagingAttachment({
    attachmentId: input.attachmentId,
    workspaceId: input.workspaceId,
    owner: input.owner,
  });

  if (
    row.status !== RequestStagingAttachmentStatus.UPLOADING &&
    row.status !== RequestStagingAttachmentStatus.PENDING &&
    row.status !== RequestStagingAttachmentStatus.FAILED
  ) {
    throw new StagingAttachmentError("Attachment cannot be deleted.", "INVALID_STATUS");
  }

  if (row.storageKey) {
    await deleteStorageKeys([row.storageKey]);

    if (row.status === RequestStagingAttachmentStatus.PENDING) {
      const { decrementWorkspaceStorageUsed } = await import(
        "@/features/attachments/server/usage-service"
      );
      await decrementWorkspaceStorageUsed(input.workspaceId, Number(row.fileSizeBytes));
    }
  }

  await prisma.requestStagingAttachment.delete({
    where: { id: row.id },
  });
}

export async function resolveStagingAttachmentsForSubmit(
  tx: Prisma.TransactionClient,
  input: {
    workspaceId: string;
    uploadSource: AttachmentUploadSource;
    attachmentIds: string[];
    uploadedById?: string | null;
  },
): Promise<RequestAttachmentRecord[]> {
  assertRequestAttachmentFileCount(input.attachmentIds.length);

  if (input.attachmentIds.length === 0) {
    return [];
  }

  const uniqueIds = [...new Set(input.attachmentIds)];

  if (uniqueIds.length !== input.attachmentIds.length) {
    throw new StagingAttachmentError("Duplicate attachment ids.", "INVALID_STATUS");
  }

  const rows = await tx.requestStagingAttachment.findMany({
    where: {
      id: { in: uniqueIds },
      workspaceId: input.workspaceId,
      uploadSource: input.uploadSource,
    },
  });

  if (rows.length !== uniqueIds.length) {
    throw new StagingAttachmentError("Staging attachment not found.", "NOT_FOUND");
  }

  const records: RequestAttachmentRecord[] = [];

  for (const row of rows) {
    if (row.status !== RequestStagingAttachmentStatus.PENDING) {
      throw new StagingAttachmentError("Attachment is not ready for submit.", "INVALID_STATUS");
    }

    if (!row.storageKey) {
      throw new StagingAttachmentError("Attachment is missing storage key.", "INVALID_STATUS");
    }

    if (isStagingExpired(row.createdAt)) {
      throw new StagingAttachmentError("Staging attachment expired.", "EXPIRED");
    }

    if (input.uploadSource === AttachmentUploadSource.INTERNAL_REQUEST) {
      if (!input.uploadedById || row.uploadedById !== input.uploadedById) {
        throw new StagingAttachmentError("Forbidden.", "FORBIDDEN");
      }
    }

    records.push(stagingRowToRequestRecord(row));
  }

  return records;
}

export async function markStagingAttachmentsLinkedInTx(
  tx: Prisma.TransactionClient,
  input: {
    attachmentIds: string[];
    estimateRequestId: string;
  },
): Promise<void> {
  if (input.attachmentIds.length === 0) {
    return;
  }

  await tx.requestStagingAttachment.updateMany({
    where: { id: { in: input.attachmentIds } },
    data: {
      status: RequestStagingAttachmentStatus.LINKED,
      estimateRequestId: input.estimateRequestId,
      linkedAt: new Date(),
    },
  });
}

export async function linkStagingAttachmentsInTx(
  tx: Prisma.TransactionClient,
  input: {
    workspaceId: string;
    uploadSource: AttachmentUploadSource;
    estimateRequestId: string;
    attachmentIds: string[];
    uploadedById?: string | null;
  },
): Promise<RequestAttachmentRecord[]> {
  const records = await resolveStagingAttachmentsForSubmit(tx, input);

  await markStagingAttachmentsLinkedInTx(tx, {
    attachmentIds: input.attachmentIds,
    estimateRequestId: input.estimateRequestId,
  });

  return records;
}

export async function resolveWorkspaceIdForPublicUpload(workspaceSlug: string) {
  const workspace = await prisma.workspace.findFirst({
    where: { slug: workspaceSlug, deletedAt: null },
    select: { id: true },
  });

  if (!workspace) {
    throw new StagingAttachmentError("Workspace not found.", "WORKSPACE_NOT_FOUND");
  }

  return workspace.id;
}

export { StorageQuotaError };
