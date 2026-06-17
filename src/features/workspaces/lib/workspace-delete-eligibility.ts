import type { SubscriptionPlan } from "@prisma/client";

import type { LiveSubscriptionForTransfer } from "@/features/workspaces/lib/transfer-eligibility-logic";

export type WorkspaceDeleteBlockReason =
  | "CANCEL_SUBSCRIPTION_REQUIRED"
  | "PENDING_TRANSFER_EXISTS";

export type WorkspaceDeleteEligibility = {
  allowed: boolean;
  blockReason: WorkspaceDeleteBlockReason | null;
};

const PAID_PLANS = new Set<SubscriptionPlan>(["PRO", "BUSINESS"]);

export function evaluateWorkspaceDeleteEligibility(input: {
  subscription: LiveSubscriptionForTransfer | null;
  hasPendingTransfer: boolean;
}): WorkspaceDeleteEligibility {
  const { subscription, hasPendingTransfer } = input;

  if (hasPendingTransfer) {
    return { allowed: false, blockReason: "PENDING_TRANSFER_EXISTS" };
  }

  if (!subscription) {
    return { allowed: true, blockReason: null };
  }

  if (!PAID_PLANS.has(subscription.plan)) {
    return { allowed: true, blockReason: null };
  }

  if (!subscription.cancelAtPeriodEnd) {
    return { allowed: false, blockReason: "CANCEL_SUBSCRIPTION_REQUIRED" };
  }

  return { allowed: true, blockReason: null };
}

