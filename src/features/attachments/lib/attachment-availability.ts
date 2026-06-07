import { MAX_FILE_SIZE_MB } from "@/features/attachments/lib/constants";

export type AttachmentAvailabilityReason =
  | "available"
  | "storage_limit_reached";

export type PublicAttachmentAvailability = {
  reason: AttachmentAvailabilityReason;
  maxFileSizeMb: number;
};

export function isAttachmentUploadAvailable(
  availability: PublicAttachmentAvailability,
): boolean {
  return availability.reason === "available";
}

export function createAvailableAttachmentAvailability(): PublicAttachmentAvailability {
  return {
    reason: "available",
    maxFileSizeMb: MAX_FILE_SIZE_MB,
  };
}

export function createStorageLimitAttachmentAvailability(): PublicAttachmentAvailability {
  return {
    reason: "storage_limit_reached",
    maxFileSizeMb: MAX_FILE_SIZE_MB,
  };
}
