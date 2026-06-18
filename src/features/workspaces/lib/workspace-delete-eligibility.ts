import type { BillingOwnershipState } from "@/features/billing/lib/billing-permissions-logic";
import type { SubscriptionPlan } from "@prisma/client";

import type { LiveSubscriptionForTransfer } from "@/features/workspaces/lib/transfer-eligibility-logic";

export type WorkspaceDeleteBlockReason =
  | "CANCEL_SUBSCRIPTION_REQUIRED"
  | "PENDING_TRANSFER_EXISTS"
  | "BILLING_HANDOFF_ACTIVE";

export type WorkspaceDeleteEligibility = {
  allowed: boolean;
  blockReason: WorkspaceDeleteBlockReason | null;
};

const PAID_PLANS = new Set<SubscriptionPlan>(["PRO", "BUSINESS"]);

export function evaluateWorkspaceDeleteEligibility(input: {
  subscription: LiveSubscriptionForTransfer | null;
  hasPendingTransfer: boolean;
  billingOwnershipState?: BillingOwnershipState;
}): WorkspaceDeleteEligibility {
  const { subscription, hasPendingTransfer } = input;

  if (input.billingOwnershipState === "HANDOFF_ACTIVE") {
    return { allowed: false, blockReason: "BILLING_HANDOFF_ACTIVE" };
  }

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

