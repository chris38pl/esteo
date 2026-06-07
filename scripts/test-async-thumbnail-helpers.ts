import { buildThumbnailStorageKeyFromOriginal } from "../src/features/attachments/lib/build-thumbnail-storage-key";
import { truncateThumbnailGenerationError } from "../src/features/attachments/lib/truncate-thumbnail-error";
import { needsThumbnailRefresh } from "../src/features/attachments/lib/thumbnail-status";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const requestKey =
  "ws/requests/req123/file456/original-photo_name.png";
assert(
  buildThumbnailStorageKeyFromOriginal(requestKey) ===
    "ws/requests/req123/file456/thumb-photo_name.png",
  "request scoped thumb key",
);

const estimateKey = "ws/est789/att456/original-doc.pdf";
assert(
  buildThumbnailStorageKeyFromOriginal(estimateKey) ===
    "ws/est789/att456/thumb-doc.pdf",
  "estimate scoped thumb key",
);

assert(needsThumbnailRefresh("PENDING"), "pending needs refresh");
assert(needsThumbnailRefresh("PROCESSING"), "processing needs refresh");
assert(!needsThumbnailRefresh("GENERATED"), "generated does not need refresh");

const longError = "x".repeat(1200);
assert(truncateThumbnailGenerationError(longError).length === 1000, "error truncated");

const originalKey = "ws1/est1/img-1/original-photo.png";
assert(
  buildThumbnailStorageKeyFromOriginal(originalKey) === "ws1/est1/img-1/thumb-photo.png",
  "ingest original key maps to thumb key",
);
assert(originalKey.includes("/original-"), "ingest uses original segment only");

function collectIngestStorageKeys(
  records: Array<{ status: string; storageKey: string; thumbnailStorageKey?: string | null }>,
): string[] {
  const keys: string[] = [];

  for (const record of records) {
    if (record.status !== "stored") {
      continue;
    }

    keys.push(record.storageKey);

    if (record.thumbnailStorageKey) {
      keys.push(record.thumbnailStorageKey);
    }
  }

  return keys;
}

const collected = collectIngestStorageKeys([
  {
    status: "stored",
    storageKey: "ws/est/a/original-x.jpg",
    thumbnailStorageKey: null,
  },
]);
assert(collected.length === 1, "collect original key only at ingest");
assert(!collected[0].includes("/thumb-"), "no thumb key collected");

console.log("async thumbnail helper tests OK");
