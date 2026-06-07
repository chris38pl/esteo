import {
  countStoredRequestAttachments,
  parseRequestAttachmentRecords,
} from "../src/features/attachments/lib/request-attachment-metadata";
import { assertRequestAttachmentFileCount } from "../src/features/attachments/lib/assert-request-attachment-limits";
import { resolveAttachmentType } from "../src/features/attachments/lib/resolve-attachment-type";
import {
  MAX_REQUEST_ATTACHMENT_FILES,
  MAX_REQUEST_ATTACHMENT_TOTAL_BYTES,
} from "../src/features/attachments/lib/request-limits";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(countStoredRequestAttachments([]) === 0, "empty count");
assert(MAX_REQUEST_ATTACHMENT_FILES === 10, "max files constant");
assert(MAX_REQUEST_ATTACHMENT_TOTAL_BYTES === 10 * 1024 * 1024, "max bytes constant");

const records = parseRequestAttachmentRecords([
  {
    id: "a",
    originalFileName: "x.jpg",
    mimeType: "image/jpeg",
    attachmentType: "IMAGE",
    fileSizeBytes: 100,
    storageKey: "k",
    status: "stored",
  },
  {
    id: "b",
    originalFileName: "y.pdf",
    mimeType: "application/pdf",
    attachmentType: "PDF",
    fileSizeBytes: 50,
    storageKey: "k2",
    status: "failed",
  },
]);

assert(records.length === 2, "parsed records");
assert(countStoredRequestAttachments(records) === 1, "stored count");

try {
  assertRequestAttachmentFileCount(11);
  throw new Error("expected file count assert");
} catch {
  // expected
}

assert(
  resolveAttachmentType(
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ) === "DOCX",
  "docx type",
);

console.log("request attachment metadata tests OK");
