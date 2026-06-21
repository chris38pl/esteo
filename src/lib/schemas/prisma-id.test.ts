import assert from "node:assert/strict";

import { isPrismaEntityId } from "./prisma-id";

assert.equal(isPrismaEntityId("rv8u0ojm1dvvvdkaiibd90kp"), true);
assert.equal(isPrismaEntityId("clh1234567890123456789012"), true);
assert.equal(isPrismaEntityId(""), false);
assert.equal(isPrismaEntityId("not-an-id"), false);

console.log("prisma-id.test.ts: ok");
