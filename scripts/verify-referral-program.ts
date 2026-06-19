import { pickAttributionCandidate } from "../src/features/referrals/server/referral-fraud-detector";
import { resolvePartnerTier, nextTierProgress } from "../src/features/referrals/lib/referral-partner-tier";
import {
  expectedRewardForPlan,
  rewardForPlanVersion,
} from "../src/features/referrals/server/referral-rewards-catalog";
import { isWithinClaimWindow } from "../src/features/referrals/lib/referral-claim-window";
import { detectReferralFraud } from "../src/features/referrals/server/referral-fraud-detector";

let failures = 0;
let checks = 0;

function assert(condition: boolean, message: string): void {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`  ✗ ${message}`);
  }
}

console.log("Referral rewards catalog:");
assert(rewardForPlanVersion("PRO_2026") === 3000, "PRO_2026 bonus = 30 PLN");
assert(rewardForPlanVersion("BUSINESS_2026") === 8000, "BUSINESS_2026 bonus = 80 PLN");
assert(expectedRewardForPlan("PRO") === 3000, "expected PRO reward");
assert(expectedRewardForPlan("FREE") === null, "FREE has no reward");

console.log("Attribution priority LINK > EMAIL > CODE:");
const picked = pickAttributionCandidate([
  { source: "CODE", referrerUserId: "code-user" },
  { source: "EMAIL", referrerUserId: "email-user" },
  { source: "LINK", referrerUserId: "link-user" },
]);
assert(picked?.referrerUserId === "link-user", "LINK wins over EMAIL and CODE");

console.log("Tier uses ACTIVE count only:");
assert(resolvePartnerTier(1) === "BRONZE", "1 active = Bronze");
assert(resolvePartnerTier(3) === "SILVER", "3 active = Silver");
assert(resolvePartnerTier(10) === "GOLD", "10 active = Gold");
assert(resolvePartnerTier(25) === "DIAMOND", "25 active = Diamond");
assert(resolvePartnerTier(0) === "NONE", "0 active = none");

const progress = nextTierProgress(2);
assert(progress.currentTier === "BRONZE" && progress.nextTier === "SILVER", "Bronze → Silver progress");

console.log("Claim window:");
const createdAt = new Date("2026-06-01T00:00:00.000Z");
assert(isWithinClaimWindow(createdAt, false), "within 30 days before payment");
assert(isWithinClaimWindow(new Date("2025-01-01"), false) === false, "outside 30 days");
assert(isWithinClaimWindow(new Date("2025-01-01"), true), "paid always within window");

console.log("Fraud detector:");
const selfReferral = detectReferralFraud({
  referrerUserId: "u1",
  referredOwnerId: "u1",
  referrerEmail: "a@test.pl",
  referredEmail: "b@test.pl",
});
assert(selfReferral.fraudFlag === "SUSPICIOUS", "self referral flagged");

const clean = detectReferralFraud({
  referrerUserId: "u1",
  referredOwnerId: "u2",
  referrerEmail: "a@other.pl",
  referredEmail: "b@client.pl",
});
assert(clean.fraudFlag === "NONE", "clean referral passes");

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  process.exit(1);
}
