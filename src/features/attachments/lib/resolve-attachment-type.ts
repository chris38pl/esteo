import { AttachmentType } from "@prisma/client";

import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  ALLOWED_IMAGE_MIME_TYPES,
  type AllowedAttachmentMimeType,
} from "@/features/attachments/lib/allowed-mime-types";

export function resolveAttachmentType(mimeType: AllowedAttachmentMimeType): AttachmentType {
  if ((ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return AttachmentType.IMAGE;
  }

  if (mimeType === "application/pdf") {
    return AttachmentType.PDF;
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return AttachmentType.DOCX;
  }

  throw new Error(`Unsupported MIME type: ${mimeType}`);
}
