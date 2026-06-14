import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

import { prisma } from "@/db/client";
import type { BillingSidebarState } from "@/features/billing/billing-sidebar-state";
import { isPaidSubscriptionStatus } from "@/server/permissions/entitlements";

export type { BillingSidebarState };

/**
 * Resolves sidebar / navbar plan UI from the ACTIVE workspace's subscription (workspace billing).
 * Falls back to a FREE upsell when there is no active workspace or subscription.
 */
export async function getBillingSidebarState(
  workspaceId: string | null,
): Promise<BillingSidebarState> {
  const subscription = workspaceId
    ? await prisma.workspace
        .findUnique({
          where: { id: workspaceId },
          select: { billingAccount: { select: { subscription: true } } },
        })
        .then((workspace) => workspace?.billingAccount?.subscription ?? null)
    : null;

  const plan: SubscriptionPlan = subscription?.plan ?? "FREE";
  const status: SubscriptionStatus = subscription?.status ?? "ACTIVE";

  if (plan === "BUSINESS" && isPaidSubscriptionStatus(status)) {
    return { variant: "status", plan: "BUSINESS", status };
  }

  if (plan === "PRO") {
    return { variant: "upsell", currentPlan: "PRO", targetPlan: "BUSINESS" };
  }

  return { variant: "upsell", currentPlan: "FREE", targetPlan: "PRO" };
}
