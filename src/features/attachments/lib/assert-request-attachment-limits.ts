import {
  MAX_REQUEST_ATTACHMENT_FILES,
  MAX_REQUEST_ATTACHMENT_TOTAL_BYTES,
} from "@/features/attachments/lib/request-limits";
import { StorageQuotaError } from "@/features/attachments/server/storage-errors";

export function assertRequestAttachmentFileCount(count: number): void {
  if (count > MAX_REQUEST_ATTACHMENT_FILES) {
    throw new StorageQuotaError(
      `Cannot attach more than ${MAX_REQUEST_ATTACHMENT_FILES} files per request.`,
      "BATCH_FILE_COUNT",
    );
  }
}

export function assertRequestAttachmentTotalSize(totalBytes: number): void {
  if (totalBytes > MAX_REQUEST_ATTACHMENT_TOTAL_BYTES) {
    throw new StorageQuotaError(
      "Total attachment size exceeds the 10 MB limit for this request.",
      "FILE_TOO_LARGE",
    );
  }
}
