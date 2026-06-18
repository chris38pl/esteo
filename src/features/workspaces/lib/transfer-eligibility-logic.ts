import type { BillingOwnershipState } from "@/features/billing/lib/billing-permissions-logic";
import type { SubscriptionPlan } from "@prisma/client";

import type { WorkspaceEffectiveStatus } from "@/server/permissions/domain";

const PAID_TRANSFER_PLANS = new Set<SubscriptionPlan>(["PRO", "BUSINESS"]);

export type TransferEligibilityBlockReason =
  | "CANCEL_SUBSCRIPTION_REQUIRED"
  | "NO_PAID_PERIOD"
  | "WORKSPACE_NOT_ACTIVE"
  | "FREE_PLAN"
  | "PENDING_TRANSFER_EXISTS"
  | "BILLING_HANDOFF_UNRESOLVED";

export type TransferEligibilitySnapshot = {
  eligible: boolean;
  blockReason: TransferEligibilityBlockReason | null;
  plan: SubscriptionPlan;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  effectiveStatus: WorkspaceEffectiveStatus | null;
};

export type LiveSubscriptionForTransfer = {
  plan: SubscriptionPlan;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
};

export function evaluateTransferEligibility(input: {
  subscription: LiveSubscriptionForTransfer | null;
  effectiveStatus: WorkspaceEffectiveStatus | null;
  hasPendingTransfer: boolean;
  billingOwnershipState?: BillingOwnershipState;
  now?: Date;
}): TransferEligibilitySnapshot {
  const { subscription, effectiveStatus, hasPendingTransfer } = input;
  const now = input.now ?? new Date();

  if (
    input.billingOwnershipState &&
    input.billingOwnershipState !== "NORMAL"
  ) {
    return {
      eligible: false,
      blockReason: "BILLING_HANDOFF_UNRESOLVED",
      plan: subscription?.plan ?? "FREE",
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      effectiveStatus,
    };
  }

  if (!subscription) {
    return {
      eligible: false,
      blockReason: "FREE_PLAN",
      plan: "FREE",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      effectiveStatus,
    };
  }

  const { plan, cancelAtPeriodEnd, currentPeriodEnd } = subscription;

  if (!PAID_TRANSFER_PLANS.has(plan)) {
    return {
      eligible: false,
      blockReason: "FREE_PLAN",
      plan,
      cancelAtPeriodEnd,
      currentPeriodEnd,
      effectiveStatus,
    };
  }

  if (hasPendingTransfer) {
    return {
      eligible: false,
      blockReason: "PENDING_TRANSFER_EXISTS",
      plan,
      cancelAtPeriodEnd,
      currentPeriodEnd,
      effectiveStatus,
    };
  }

  if (!cancelAtPeriodEnd) {
    return {
      eligible: false,
      blockReason: "CANCEL_SUBSCRIPTION_REQUIRED",
      plan,
      cancelAtPeriodEnd,
      currentPeriodEnd,
      effectiveStatus,
    };
  }

  if (!currentPeriodEnd || currentPeriodEnd.getTime() <= now.getTime()) {
    return {
      eligible: false,
      blockReason: "NO_PAID_PERIOD",
      plan,
      cancelAtPeriodEnd,
      currentPeriodEnd,
      effectiveStatus,
    };
  }

  if (effectiveStatus !== "ACTIVE") {
    return {
      eligible: false,
      blockReason: "WORKSPACE_NOT_ACTIVE",
      plan,
      cancelAtPeriodEnd,
      currentPeriodEnd,
      effectiveStatus,
    };
  }

  return {
    eligible: true,
    blockReason: null,
    plan,
    cancelAtPeriodEnd,
    currentPeriodEnd,
    effectiveStatus,
  };
}

export function transferEligibilityErrorMessage(
  reason: TransferEligibilityBlockReason | null,
): string {
  switch (reason) {
    case "CANCEL_SUBSCRIPTION_REQUIRED":
      return "Cancel the current subscription before transferring ownership.";
    case "NO_PAID_PERIOD":
      return "This workspace has no remaining paid billing period.";
    case "WORKSPACE_NOT_ACTIVE":
      return "This workspace is not active.";
    case "FREE_PLAN":
      return "Only Pro or Business workspaces can be transferred.";
    case "PENDING_TRANSFER_EXISTS":
      return "A workspace ownership transfer is already pending.";
    case "BILLING_HANDOFF_UNRESOLVED":
      return "Resolve billing handoff before transferring ownership again.";
    default:
      return "This workspace cannot be transferred right now.";
  }
}
