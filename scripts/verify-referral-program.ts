import { pickAttributionCandidate } from "../src/features/referrals/server/referral-fraud-detector";
import { resolvePartnerTier, nextTierProgress } from "../src/features/referrals/lib/referral-partner-tier";
import {
  expectedRewardForPlan,
  rewardForPlanVersion,
} from "../src/features/referrals/server/referral-rewards-catalog";
import { isWithinClaimWindow } from "../src/features/referrals/lib/referral-claim-window";
import {
  extractReferralCodeFromAuthSearchParams,
  extractReferralCodeFromRedirectUrl,
} from "../src/features/referrals/lib/referral-auth-search-params";
import { detectReferralFraud } from "../src/features/referrals/server/referral-fraud-detector";
import { computeReferralKpiFromRows, computeUsedReferralBalanceCents } from "../src/features/referrals/lib/referral-kpi-utils";
import { resolveReferralPayoutStatusKey } from "../src/features/referrals/lib/referral-payout-status";

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

console.log("Email referrer lookup (lazy-create vs granular errors):");
function classifyEmailReferrerFailure(
  userExists: boolean,
  canGenerateReferrals: boolean,
): "NOT_FOUND" | "PARTNER_NOT_ELIGIBLE" | null {
  if (!userExists) {
    return "NOT_FOUND";
  }
  if (!canGenerateReferrals) {
    return "PARTNER_NOT_ELIGIBLE";
  }
  return null;
}
assert(
  classifyEmailReferrerFailure(false, false) === "NOT_FOUND",
  "unknown email → NOT_FOUND",
);
assert(
  classifyEmailReferrerFailure(true, false) === "PARTNER_NOT_ELIGIBLE",
  "FREE-only user → PARTNER_NOT_ELIGIBLE",
);
assert(
  classifyEmailReferrerFailure(true, true) === null,
  "paid user → profile lazy-created on lookup",
);

console.log("Referral KPI (rewardStatus-based):");
const kpiRows = [
  { status: "ACTIVE", rewardCents: 8000, rewardStatus: "GRANTED" as const },
  { status: "ACTIVE", rewardCents: 3000, rewardStatus: "PENDING" as const },
  { status: "ACTIVE", rewardCents: 5000, rewardStatus: "FAILED" as const },
  { status: "PENDING_CLAIM", rewardCents: 0, rewardStatus: null },
];
const kpi = computeReferralKpiFromRows(kpiRows);
assert(kpi.grantedRewardsCents === 8000, "granted = GRANTED only");
assert(kpi.processingBalanceCents === 8000, "processing = PENDING + FAILED");
assert(kpi.referredCompaniesCount === 3, "referredCompanies = ACTIVE count");
assert(
  kpi.grantedRewardsCents + kpi.processingBalanceCents === 16000,
  "granted + processing = active reward total",
);

console.log("Used referral balance (granted - available):");
assert(computeUsedReferralBalanceCents(11000, 11000) === 0, "nothing used when granted = available");
assert(computeUsedReferralBalanceCents(11000, 8000) === 3000, "partial use on invoices");
assert(computeUsedReferralBalanceCents(84000, 65400) === 18600, "large partner partial use");
assert(
  computeUsedReferralBalanceCents(8000, 10000) === 0,
  "used never negative when available exceeds granted",
);
assert(
  computeUsedReferralBalanceCents(kpi.grantedRewardsCents, kpi.grantedRewardsCents) === 0,
  "used = 0 when available equals granted (processing not counted as used)",
);
assert(
  kpi.grantedRewardsCents + kpi.processingBalanceCents ===
    computeUsedReferralBalanceCents(kpi.grantedRewardsCents, 0) + kpi.processingBalanceCents,
  "processing rewards do not inflate used balance",
);

console.log("Payout status (partner-facing):");
assert(
  resolveReferralPayoutStatusKey(
    { status: "ACTIVE", rewardStatus: "GRANTED", referredPlan: "PRO", expectedRewardCents: 3000 },
    "ACTIVE",
    true,
  ) === "bonus_granted",
  "GRANTED → bonus_granted",
);
assert(
  resolveReferralPayoutStatusKey(
    { status: "ACTIVE", rewardStatus: "PENDING", referredPlan: "PRO", expectedRewardCents: 3000 },
    "ACTIVE",
    true,
  ) === "processing_bonus",
  "PENDING → processing_bonus",
);
assert(
  resolveReferralPayoutStatusKey(
    { status: "ACTIVE", rewardStatus: "FAILED", referredPlan: "PRO", expectedRewardCents: 3000 },
    "ACTIVE",
    true,
  ) === "processing_bonus",
  "FAILED → processing_bonus (no error label)",
);

console.log("Referral auth search params:");
assert(
  extractReferralCodeFromRedirectUrl("http://localhost:3000/pl/r/CHAZ") === "CHAZ",
  "redirect_url extracts referral code",
);
assert(
  extractReferralCodeFromAuthSearchParams({
    redirect_url: "http://localhost:3000/pl/sign-in?redirect_url=http%3A%2F%2Flocalhost%3A3000%2Fpl%2Fr%2FCHAZ",
  }) === null,
  "nested redirect without /r/ path returns null",
);
assert(
  extractReferralCodeFromAuthSearchParams({
    ref: "CHAZ",
  }) === "CHAZ",
  "ref query param extracts referral code",
);
assert(
  extractReferralCodeFromAuthSearchParams({
    redirect_url: "http://localhost:3000/pl/r/JUNIORKRAWIEC",
  }) === "JUNIORKRAWIEC",
  "redirect_url to referral landing extracts code",
);

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  process.exit(1);
}
