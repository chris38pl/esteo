import {
  deriveBillingOwnershipState,
  evaluateWorkspaceBillingPermissions,
  isHandoffTimedOut,
} from "../src/features/billing/lib/billing-permissions-logic";
import { evaluateTransferEligibility } from "../src/features/workspaces/lib/transfer-eligibility-logic";

let failures = 0;
let checks = 0;

function assert(condition: boolean, message: string): void {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`  ✗ ${message}`);
  }
}

const NOW = new Date("2026-06-17T12:00:00.000Z");
const HANDOFF_EXPIRED_AT = new Date("2026-04-01T12:00:00.000Z");
const TIMED_OUT_AT = new Date("2026-01-01T12:00:00.000Z");

console.log("deriveBillingOwnershipState:");

assert(
  deriveBillingOwnershipState({
    ownerUserId: "owner",
    payerUserId: "owner",
    subscriptionStatus: "ACTIVE",
    subscriptionPlan: "PRO",
    now: NOW,
  }) === "NORMAL",
  "owner === payer → NORMAL",
);

assert(
  deriveBillingOwnershipState({
    ownerUserId: "new-owner",
    payerUserId: "old-payer",
    subscriptionStatus: "ACTIVE",
    subscriptionPlan: "BUSINESS",
    stripeSubscriptionId: "sub_1",
    now: NOW,
  }) === "HANDOFF_ACTIVE",
  "owner !== payer + paid ACTIVE → HANDOFF_ACTIVE",
);

assert(
  deriveBillingOwnershipState({
    ownerUserId: "new-owner",
    payerUserId: "old-payer",
    subscriptionStatus: "ACTIVE",
    subscriptionPlan: "BUSINESS",
    stripeSubscriptionId: "sub_1",
    now: NOW,
  }) === "HANDOFF_ACTIVE",
  "HANDOFF_ACTIVE regardless of cancelAtPeriodEnd (not an input)",
);

assert(
  deriveBillingOwnershipState({
    ownerUserId: "new-owner",
    payerUserId: "old-payer",
    subscriptionStatus: "EXPIRED",
    subscriptionPlan: "BUSINESS",
    handoffExpiredAt: HANDOFF_EXPIRED_AT,
    stripeSubscriptionId: null,
    now: NOW,
  }) === "HANDOFF_EXPIRED",
  "EXPIRED handoff within 90 days → HANDOFF_EXPIRED",
);

assert(
  deriveBillingOwnershipState({
    ownerUserId: "new-owner",
    payerUserId: "old-payer",
    subscriptionStatus: "EXPIRED",
    subscriptionPlan: "FREE",
    handoffExpiredAt: TIMED_OUT_AT,
    stripeSubscriptionId: null,
    now: NOW,
  }) === "NORMAL",
  "90-day timeout (derived) → NORMAL",
);

assert(
  isHandoffTimedOut(TIMED_OUT_AT, NOW) === true,
  "isHandoffTimedOut true after 90 days",
);

console.log("\nBilling permissions - HANDOFF_ACTIVE:");

const handoffOwner = evaluateWorkspaceBillingPermissions({
  userId: "new-owner",
  workspaceOwnerId: "new-owner",
  payerUserId: "old-payer",
  isActiveMember: true,
  subscriptionStatus: "ACTIVE",
  subscriptionPlan: "BUSINESS",
  stripeSubscriptionId: "sub_1",
  now: NOW,
});
assert(handoffOwner.canViewBilling === true, "handoff owner → canViewBilling");
assert(handoffOwner.canManageBilling === false, "handoff owner → !canManageBilling");
assert(handoffOwner.canChangePlanOrAddons === false, "handoff owner → !canChangePlanOrAddons");
assert(handoffOwner.billingOwnershipState === "HANDOFF_ACTIVE", "handoff owner state");

const handoffPayer = evaluateWorkspaceBillingPermissions({
  userId: "old-payer",
  workspaceOwnerId: "new-owner",
  payerUserId: "old-payer",
  isActiveMember: false,
  subscriptionStatus: "ACTIVE",
  subscriptionPlan: "BUSINESS",
  stripeSubscriptionId: "sub_1",
  now: NOW,
});
assert(handoffPayer.canManageBilling === true, "handoff payer → canManageBilling");
assert(handoffPayer.canChangePlanOrAddons === false, "handoff payer → !canChangePlanOrAddons (add-on fix)");
assert(handoffPayer.canResumeSubscription === false, "handoff payer → !canResumeSubscription");

console.log("\nBilling permissions - HANDOFF_EXPIRED:");

const expiredOwner = evaluateWorkspaceBillingPermissions({
  userId: "new-owner",
  workspaceOwnerId: "new-owner",
  payerUserId: "old-payer",
  isActiveMember: true,
  subscriptionStatus: "EXPIRED",
  subscriptionPlan: "BUSINESS",
  handoffExpiredAt: HANDOFF_EXPIRED_AT,
  stripeSubscriptionId: null,
  now: NOW,
});
assert(expiredOwner.canPurchaseSubscription === true, "expired handoff owner → canPurchaseSubscription");
assert(expiredOwner.canManageBilling === true, "expired handoff owner → canManageBilling");

const expiredPayer = evaluateWorkspaceBillingPermissions({
  userId: "old-payer",
  workspaceOwnerId: "new-owner",
  payerUserId: "old-payer",
  isActiveMember: false,
  subscriptionStatus: "EXPIRED",
  subscriptionPlan: "BUSINESS",
  handoffExpiredAt: HANDOFF_EXPIRED_AT,
  stripeSubscriptionId: null,
  now: NOW,
});
assert(expiredPayer.canViewBilling === false, "expired ex-payer → !canViewBilling");
assert(expiredPayer.canManageBilling === false, "expired ex-payer → !canManageBilling");

const expiredMember = evaluateWorkspaceBillingPermissions({
  userId: "member",
  workspaceOwnerId: "new-owner",
  payerUserId: "old-payer",
  isActiveMember: true,
  subscriptionStatus: "EXPIRED",
  subscriptionPlan: "BUSINESS",
  handoffExpiredAt: HANDOFF_EXPIRED_AT,
  stripeSubscriptionId: null,
  now: NOW,
});
assert(expiredMember.canPurchaseSubscription === false, "expired member → !canPurchaseSubscription");

console.log("\nBilling permissions - post handoff completed (owner=payer):");

const completedOwner = evaluateWorkspaceBillingPermissions({
  userId: "new-owner",
  workspaceOwnerId: "new-owner",
  payerUserId: "new-owner",
  isActiveMember: true,
  subscriptionStatus: "ACTIVE",
  subscriptionPlan: "PRO",
  stripeSubscriptionId: "sub_new",
  now: NOW,
});
assert(completedOwner.canChangePlanOrAddons === true, "completed handoff owner → canChangePlanOrAddons");
assert(completedOwner.canResumeSubscription === true, "NORMAL owner-payer → canResumeSubscription");

const exPayerAfterComplete = evaluateWorkspaceBillingPermissions({
  userId: "old-payer",
  workspaceOwnerId: "new-owner",
  payerUserId: "new-owner",
  isActiveMember: false,
  subscriptionStatus: "ACTIVE",
  subscriptionPlan: "PRO",
  stripeSubscriptionId: "sub_new",
  now: NOW,
});
assert(exPayerAfterComplete.canViewBilling === false, "ex-payer after completion → !canViewBilling");

console.log("\nTransfer eligibility - billing handoff unresolved:");

const blockedActive = evaluateTransferEligibility({
  subscription: {
    plan: "PRO",
    cancelAtPeriodEnd: true,
    currentPeriodEnd: new Date("2026-12-01"),
  },
  effectiveStatus: "ACTIVE",
  hasPendingTransfer: false,
  billingOwnershipState: "HANDOFF_ACTIVE",
});
assert(
  blockedActive.blockReason === "BILLING_HANDOFF_UNRESOLVED",
  "HANDOFF_ACTIVE blocks transfer",
);

const blockedExpired = evaluateTransferEligibility({
  subscription: null,
  effectiveStatus: "EXPIRED",
  hasPendingTransfer: false,
  billingOwnershipState: "HANDOFF_EXPIRED",
});
assert(
  blockedExpired.blockReason === "BILLING_HANDOFF_UNRESOLVED",
  "HANDOFF_EXPIRED blocks transfer",
);

console.log(`\n${checks} checks, ${failures} failure(s).`);

if (failures > 0) {
  process.exit(1);
}

console.log("All billing authorization checks passed.");
