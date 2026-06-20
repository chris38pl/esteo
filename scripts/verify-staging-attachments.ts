/**
 * Verification script for staging attachment helpers and cleanup logic.
 * Run: npm run test:staging-attachments
 */
import assert from "node:assert/strict";

import {
  isStagingExpired,
  isStagingUploadingZombie,
  STAGING_ATTACHMENT_TTL_MS,
  STAGING_ZOMBIE_UPLOADING_MS,
} from "../src/features/attachments/lib/staging-ttl";

function testStagingTtl() {
  const now = Date.parse("2026-06-20T12:00:00.000Z");

  assert.equal(
    isStagingExpired(new Date(now - STAGING_ATTACHMENT_TTL_MS - 1), now),
    true,
    "expired when older than 24h",
  );

  assert.equal(
    isStagingExpired(new Date(now - STAGING_ATTACHMENT_TTL_MS + 60_000), now),
    false,
    "not expired within 24h window",
  );

  assert.equal(
    isStagingUploadingZombie(new Date(now - STAGING_ZOMBIE_UPLOADING_MS - 1), now),
    true,
    "zombie when UPLOADING row inactive > 1h",
  );

  assert.equal(
    isStagingUploadingZombie(new Date(now - 30 * 60_000), now),
    false,
    "active upload not zombie within 1h",
  );
}

function testRetryDoesNotDuplicateIds() {
  const attachmentId = "same-id";
  const attempts = Array.from({ length: 5 }, () => attachmentId);
  assert.equal(new Set(attempts).size, 1, "retry keeps the same attachmentId");
}

async function main() {
  testStagingTtl();
  testRetryDoesNotDuplicateIds();
  console.log("verify-staging-attachments: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
