import type { AttachmentUploadSource, EstimateAttachment } from "@prisma/client";

import type { AttachmentThumbnailStatusClient } from "@/features/attachments/lib/thumbnail-status";

export type EstimateAttachmentClient = {
  id: string;
  estimateId: string;
  attachmentType: "IMAGE" | "PDF" | "DOCX";
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: string;
  imageWidth: number | null;
  imageHeight: number | null;
  thumbnailStatus: AttachmentThumbnailStatusClient;
  hasThumbnail: boolean;
  uploadSource: AttachmentUploadSource;
  createdAt: string;
  uploadedBy: {
    id: string;
    name: string | null;
  } | null;
};

export function serializeEstimateAttachment(
  row: EstimateAttachment & {
    uploadedBy: { id: string; name: string | null } | null;
  },
): EstimateAttachmentClient {
  const thumbnailStatus = row.thumbnailStatus as AttachmentThumbnailStatusClient;

  return {
    id: row.id,
    estimateId: row.estimateId,
    attachmentType: row.attachmentType,
    originalFileName: row.originalFileName,
    mimeType: row.mimeType,
    fileSizeBytes: row.fileSizeBytes.toString(),
    imageWidth: row.imageWidth,
    imageHeight: row.imageHeight,
    thumbnailStatus,
    hasThumbnail: thumbnailStatus === "GENERATED",
    uploadSource: row.uploadSource,
    createdAt: row.createdAt.toISOString(),
    uploadedBy: row.uploadedBy
      ? {
          id: row.uploadedBy.id,
          name: row.uploadedBy.name,
        }
      : null,
  };
}

export function serializeEstimateAttachments(
  rows: Array<
    EstimateAttachment & {
      uploadedBy: { id: string; name: string | null } | null;
    }
  >,
): EstimateAttachmentClient[] {
  return rows.map(serializeEstimateAttachment);
}

export type WorkspaceStorageSummaryClient = {
  usedBytes: string;
  limitBytes: string;
  usedFormatted: string;
  limitFormatted: string;
  usedPercent: number;
  level: "ok" | "approaching_limit" | "exhausted";
};

export function serializeWorkspaceStorageSummary(summary: {
  usedBytes: bigint;
  limitBytes: bigint;
  usedFormatted: string;
  limitFormatted: string;
  usedPercent: number;
  level: "ok" | "approaching_limit" | "exhausted";
}): WorkspaceStorageSummaryClient {
  return {
    usedBytes: summary.usedBytes.toString(),
    limitBytes: summary.limitBytes.toString(),
    usedFormatted: summary.usedFormatted,
    limitFormatted: summary.limitFormatted,
    usedPercent: summary.usedPercent,
    level: summary.level,
  };
}
