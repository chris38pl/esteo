import assert from "node:assert/strict";

import {
  formatDecimalInputDisplay,
  formatPercentInputDisplay,
  isValidDecimalDraft,
  parseDecimalInput,
  parsePercentInput,
  roundDecimal,
} from "./decimal-input";

assert.equal(formatDecimalInputDisplay(0), "");
assert.equal(formatDecimalInputDisplay(50), "50");
assert.equal(formatDecimalInputDisplay(12.5), "12.5");
assert.equal(formatDecimalInputDisplay(0, { emptyZero: false }), "0");

assert.equal(parseDecimalInput(""), 0);
assert.equal(parseDecimalInput("12,5"), 12.5);
assert.equal(parseDecimalInput("12.5"), 12.5);
assert.equal(parseDecimalInput("."), 0);
assert.equal(parseDecimalInput("abc"), 0);

assert.equal(roundDecimal(1.006), 1.01);
assert.equal(roundDecimal(1.004), 1);

assert.equal(isValidDecimalDraft(""), true);
assert.equal(isValidDecimalDraft("12,5"), true);
assert.equal(isValidDecimalDraft("12.5"), true);
assert.equal(isValidDecimalDraft("abc"), false);
assert.equal(isValidDecimalDraft("12a"), false);

assert.equal(formatPercentInputDisplay(0.23), "23");
assert.equal(formatPercentInputDisplay(0), "");
assert.equal(parsePercentInput("23"), 0.23);

console.log("decimal-input.test.ts: all assertions passed");
