import {
  MAX_REQUEST_ATTACHMENT_FILES,
  MAX_REQUEST_ATTACHMENT_TOTAL_BYTES,
} from "@/features/attachments/lib/request-limits";
import { STAGING_ATTACHMENT_TTL_MS } from "@/features/attachments/lib/staging-ttl";
import { StagingAttachmentError } from "@/features/attachments/server/staging-attachment-errors";
import { StorageQuotaError } from "@/features/attachments/server/storage-errors";
import { prisma } from "@/db/client";
import type { RequestStagingAttachmentStatus } from "@prisma/client";

const ACTIVE_STATUSES: RequestStagingAttachmentStatus[] = ["UPLOADING", "PENDING", "FAILED"];

function stagingCutoff(now = Date.now()) {
  return new Date(now - STAGING_ATTACHMENT_TTL_MS);
}

export async function assertOwnerStagingLimits(input: {
  workspaceId: string;
  owner: { publicFingerprint: string } | { uploadedById: string };
  additionalFileCount?: number;
  additionalBytes?: number;
}): Promise<void> {
  const cutoff = stagingCutoff();
  const ownerFilter =
    "publicFingerprint" in input.owner
      ? { publicFingerprint: input.owner.publicFingerprint }
      : { uploadedById: input.owner.uploadedById };

  const rows = await prisma.requestStagingAttachment.findMany({
    where: {
      workspaceId: input.workspaceId,
      status: { in: ACTIVE_STATUSES },
      createdAt: { gte: cutoff },
      ...ownerFilter,
    },
    select: { fileSizeBytes: true },
  });

  const nextCount = rows.length + (input.additionalFileCount ?? 1);

  if (nextCount > MAX_REQUEST_ATTACHMENT_FILES) {
    throw new StorageQuotaError(
      `Cannot attach more than ${MAX_REQUEST_ATTACHMENT_FILES} files per request.`,
      "BATCH_FILE_COUNT",
    );
  }

  const currentBytes = rows.reduce((sum, row) => sum + Number(row.fileSizeBytes), 0);
  const nextBytes = currentBytes + (input.additionalBytes ?? 0);

  if (nextBytes > MAX_REQUEST_ATTACHMENT_TOTAL_BYTES) {
    throw new StorageQuotaError(
      "Total attachment size exceeds the 10 MB limit for this request.",
      "FILE_TOO_LARGE",
    );
  }
}

export async function findActiveStagingAttachment(input: {
  attachmentId: string;
  workspaceId: string;
  owner: { publicFingerprint: string } | { uploadedById: string };
}) {
  const ownerFilter =
    "publicFingerprint" in input.owner
      ? { publicFingerprint: input.owner.publicFingerprint }
      : { uploadedById: input.owner.uploadedById };

  const row = await prisma.requestStagingAttachment.findFirst({
    where: {
      id: input.attachmentId,
      workspaceId: input.workspaceId,
      ...ownerFilter,
    },
  });

  if (!row) {
    throw new StagingAttachmentError("Staging attachment not found.", "NOT_FOUND");
  }

  return row;
}
