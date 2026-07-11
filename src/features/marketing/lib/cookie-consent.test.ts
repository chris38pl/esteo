import assert from "node:assert/strict";

import {
  buildCookieConsent,
  COOKIE_CONSENT_NAME,
  COOKIE_CONSENT_VERSION,
  getConsentSummary,
  needsConsentPrompt,
  parseCookieConsent,
} from "./cookie-consent";

const sample = buildCookieConsent(true);
const encoded = encodeURIComponent(JSON.stringify(sample));
const cookieHeader = `${COOKIE_CONSENT_NAME}=${encoded}; NEXT_LOCALE=pl`;

const parsed = parseCookieConsent(cookieHeader);
assert.equal(parsed?.analytics, true);
assert.equal(parsed?.version, COOKIE_CONSENT_VERSION);

assert.equal(needsConsentPrompt(null), true);
assert.equal(needsConsentPrompt(parsed), false);
assert.equal(needsConsentPrompt({ ...sample, version: "0.9" }), true);

const summary = getConsentSummary(parsed);
assert.equal(summary.hasChoice, true);
assert.equal(summary.analytics, true);

const rejected = buildCookieConsent(false);
assert.equal(rejected.analytics, false);

console.log("cookie-consent.test.ts: all assertions passed");
