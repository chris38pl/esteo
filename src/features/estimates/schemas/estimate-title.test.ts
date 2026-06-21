import assert from "node:assert/strict";

import { updateEstimateTitleSchema } from "./estimate-title";

const CUID2_ESTIMATE_ID = "rv8u0ojm1dvvvdkaiibd90kp";
const CUID_V1_WORKSPACE_ID = "clh1234567890123456789012";

const baseInput = {
  estimateId: CUID2_ESTIMATE_ID,
  workspaceId: CUID_V1_WORKSPACE_ID,
  workspaceSlug: "firma-juniora",
  title: "Wykończenie mieszkania fajne",
  locale: "pl" as const,
};

const cuid2Parse = updateEstimateTitleSchema.safeParse(baseInput);
assert.equal(cuid2Parse.success, true, "cuid2 estimateId should pass validation");
if (cuid2Parse.success) {
  assert.equal(cuid2Parse.data.title, "Wykończenie mieszkania fajne");
}

const cuidV1Parse = updateEstimateTitleSchema.safeParse({
  ...baseInput,
  estimateId: "clh1234567890123456789012",
});
assert.equal(cuidV1Parse.success, true, "cuid v1 estimateId should pass validation");

const emptyTitleParse = updateEstimateTitleSchema.safeParse({
  ...baseInput,
  title: "   ",
});
assert.equal(emptyTitleParse.success, true, "whitespace-only title should pass schema");
if (emptyTitleParse.success) {
  assert.equal(emptyTitleParse.data.title, null);
}

const invalidIdParse = updateEstimateTitleSchema.safeParse({
  ...baseInput,
  estimateId: "not-an-id",
});
assert.equal(invalidIdParse.success, false, "invalid estimateId should fail validation");

console.log("estimate-title.test.ts: ok");
