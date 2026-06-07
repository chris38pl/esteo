export type AttachmentThumbnailStatusClient =
  | "NOT_APPLICABLE"
  | "PENDING"
  | "PROCESSING"
  | "GENERATED"
  | "FAILED";

export function needsThumbnailRefresh(status: AttachmentThumbnailStatusClient): boolean {
  return status === "PENDING" || status === "PROCESSING";
}
