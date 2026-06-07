export type RequestAttachmentRecord = {
  id: string;
  originalFileName: string;
  mimeType: string;
  attachmentType: "IMAGE" | "PDF" | "DOCX";
  fileSizeBytes: number;
  storageKey: string;
  thumbnailStorageKey?: string | null;
  /** Forward-compatible; thumbnails are tracked on EstimateAttachment post-promotion. */
  thumbnailStatus?: "PENDING" | "PROCESSING" | "GENERATED" | "FAILED" | "NOT_APPLICABLE";
  imageWidth?: number | null;
  imageHeight?: number | null;
  status: "stored" | "failed";
  error?: string;
  promotedAt?: string | null;
};

export type AttachmentsPromotionStatus = "PENDING" | "COMPLETED" | "FAILED";

export function isRequestAttachmentRecord(value: unknown): value is RequestAttachmentRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    typeof record.originalFileName === "string" &&
    typeof record.mimeType === "string" &&
    (record.attachmentType === "IMAGE" ||
      record.attachmentType === "PDF" ||
      record.attachmentType === "DOCX") &&
    typeof record.fileSizeBytes === "number" &&
    typeof record.storageKey === "string" &&
    (record.status === "stored" || record.status === "failed")
  );
}

export function parseRequestAttachmentRecords(raw: unknown): RequestAttachmentRecord[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter(isRequestAttachmentRecord);
}

export function countStoredRequestAttachments(records: RequestAttachmentRecord[]): number {
  return records.filter((record) => record.status === "stored").length;
}

export function getStoredRequestAttachments(
  records: RequestAttachmentRecord[],
): RequestAttachmentRecord[] {
  return records.filter((record) => record.status === "stored" && !record.promotedAt);
}
