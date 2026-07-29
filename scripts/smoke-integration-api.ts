/**
 * Lightweight Integration Platform contract smoke checks (no live HTTP/DB).
 * Run: npx tsx scripts/smoke-integration-api.ts
 */

import assert from "node:assert/strict";

import { WorkspaceIndustry } from "@prisma/client";

import { ALLOWED_ATTACHMENT_MIME_TYPES } from "../src/features/attachments/lib/allowed-mime-types";
import { buildIntegrationSchema } from "../src/server/integrations/schema/builder";
import { getIntegrationErrorCopy } from "../src/server/integrations/i18n/errors";
import {
  DEFAULT_API_KEY_SCOPES,
  INTEGRATION_API_VERSION,
  INTEGRATION_SCHEMA_VERSION,
} from "../src/server/integrations/version";

const construction = buildIntegrationSchema(WorkspaceIndustry.CONSTRUCTION);
assert.ok(Array.isArray(construction.fields));
assert.equal(construction.version, INTEGRATION_SCHEMA_VERSION);
assert.ok(construction.example.customer);
assert.ok(construction.limits.maxAttachments >= 1);
assert.deepEqual(
  [...construction.limits.allowedMimeTypes].sort(),
  [...ALLOWED_ATTACHMENT_MIME_TYPES].sort(),
);

const services = buildIntegrationSchema(WorkspaceIndustry.OTHER);
assert.ok(
  services.example.address &&
    typeof services.example.address === "object" &&
    "serviceLocation" in (services.example.address as object),
);

const pl = getIntegrationErrorCopy("ATTACHMENT_LIMIT_EXCEEDED", "pl");
const en = getIntegrationErrorCopy("ATTACHMENT_LIMIT_EXCEEDED", "en");
assert.ok(pl.message.length > 0);
assert.ok(en.message.length > 0);
assert.notEqual(pl.message, en.message);

assert.equal(INTEGRATION_API_VERSION, "v1");
assert.deepEqual([...DEFAULT_API_KEY_SCOPES], ["requests:write"]);

console.log("integration-api smoke: ok");
