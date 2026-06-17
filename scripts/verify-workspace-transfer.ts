import { evaluateTransferEligibility } from "../src/features/workspaces/lib/transfer-eligibility-logic";
import { evaluateWorkspaceDeleteEligibility } from "../src/features/workspaces/lib/workspace-delete-eligibility";

let failures = 0;
let checks = 0;

function assert(condition: boolean, message: string): void {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`  ✗ ${message}`);
  }
}

const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const PAST = new Date(Date.now() - 24 * 60 * 60 * 1000);

console.log("Transfer eligibility:");

const eligible = evaluateTransferEligibility({
  subscription: {
    plan: "PRO",
    cancelAtPeriodEnd: true,
    currentPeriodEnd: FUTURE,
  },
  effectiveStatus: "ACTIVE",
  hasPendingTransfer: false,
});
assert(eligible.eligible === true, "PRO + cancelAtPeriodEnd + future period + ACTIVE → eligible");
assert(eligible.blockReason === null, "eligible has no block reason");

const needsCancel = evaluateTransferEligibility({
  subscription: {
    plan: "BUSINESS",
    cancelAtPeriodEnd: false,
    currentPeriodEnd: FUTURE,
  },
  effectiveStatus: "ACTIVE",
  hasPendingTransfer: false,
});
assert(
  needsCancel.blockReason === "CANCEL_SUBSCRIPTION_REQUIRED",
  "active sub without cancelAtPeriodEnd → CANCEL_SUBSCRIPTION_REQUIRED",
);

const noPeriod = evaluateTransferEligibility({
  subscription: {
    plan: "PRO",
    cancelAtPeriodEnd: true,
    currentPeriodEnd: PAST,
  },
  effectiveStatus: "ACTIVE",
  hasPendingTransfer: false,
});
assert(noPeriod.blockReason === "NO_PAID_PERIOD", "past currentPeriodEnd → NO_PAID_PERIOD");

const notActive = evaluateTransferEligibility({
  subscription: {
    plan: "PRO",
    cancelAtPeriodEnd: true,
    currentPeriodEnd: FUTURE,
  },
  effectiveStatus: "EXPIRED",
  hasPendingTransfer: false,
});
assert(
  notActive.blockReason === "WORKSPACE_NOT_ACTIVE",
  "non-ACTIVE effective status → WORKSPACE_NOT_ACTIVE",
);

const freePlan = evaluateTransferEligibility({
  subscription: {
    plan: "FREE",
    cancelAtPeriodEnd: true,
    currentPeriodEnd: FUTURE,
  },
  effectiveStatus: "ACTIVE",
  hasPendingTransfer: false,
});
assert(freePlan.blockReason === "FREE_PLAN", "FREE plan → FREE_PLAN");

const pending = evaluateTransferEligibility({
  subscription: {
    plan: "PRO",
    cancelAtPeriodEnd: true,
    currentPeriodEnd: FUTURE,
  },
  effectiveStatus: "ACTIVE",
  hasPendingTransfer: true,
});
assert(
  pending.blockReason === "PENDING_TRANSFER_EXISTS",
  "existing pending transfer → PENDING_TRANSFER_EXISTS (initiate only)",
);

const acceptWithPending = evaluateTransferEligibility({
  subscription: {
    plan: "PRO",
    cancelAtPeriodEnd: true,
    currentPeriodEnd: FUTURE,
  },
  effectiveStatus: "ACTIVE",
  hasPendingTransfer: false,
});
assert(
  acceptWithPending.eligible === true,
  "accept re-check ignores pending transfer existence (hasPendingTransfer: false)",
);

const noSub = evaluateTransferEligibility({
  subscription: null,
  effectiveStatus: "ACTIVE",
  hasPendingTransfer: false,
});
assert(noSub.blockReason === "FREE_PLAN", "missing subscription → FREE_PLAN");

console.log("\nWorkspace delete eligibility:");

const deleteAllowedFree = evaluateWorkspaceDeleteEligibility({
  subscription: null,
  hasPendingTransfer: false,
});
assert(deleteAllowedFree.allowed === true, "FREE (no subscription) → delete allowed");

const deleteBlockedRenewing = evaluateWorkspaceDeleteEligibility({
  subscription: {
    plan: "PRO",
    cancelAtPeriodEnd: false,
    currentPeriodEnd: FUTURE,
  },
  hasPendingTransfer: false,
});
assert(
  deleteBlockedRenewing.blockReason === "CANCEL_SUBSCRIPTION_REQUIRED",
  "PRO with renewing subscription → delete blocked (cancel required)",
);

const deleteBlockedPendingTransfer = evaluateWorkspaceDeleteEligibility({
  subscription: {
    plan: "BUSINESS",
    cancelAtPeriodEnd: true,
    currentPeriodEnd: FUTURE,
  },
  hasPendingTransfer: true,
});
assert(
  deleteBlockedPendingTransfer.blockReason === "PENDING_TRANSFER_EXISTS",
  "pending ownership transfer → delete blocked",
);

const deleteAllowedCancelled = evaluateWorkspaceDeleteEligibility({
  subscription: {
    plan: "BUSINESS",
    cancelAtPeriodEnd: true,
    currentPeriodEnd: FUTURE,
  },
  hasPendingTransfer: false,
});
assert(deleteAllowedCancelled.allowed === true, "paid + cancelAtPeriodEnd → delete allowed");

// Inbox routing (manual): hasPendingInboxItems = member invitations OR ownership transfers.
// - /dashboard/invitations accessible when hasPendingInboxItems (even with existing workspaces)
// - /dashboard/onboarding blocked when hasPendingInboxItems and no workspaces
// - /dashboard landing sends users with pending inbox to /invitations

console.log(`\n${checks} checks, ${failures} failure(s).`);

if (failures > 0) {
  process.exit(1);
}

console.log("All workspace transfer/delete checks passed.");
