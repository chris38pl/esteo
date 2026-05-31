import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

import { getSubscriptionForUser } from "@/features/billing/server/provision-billing-account";
import type { BillingSidebarState } from "@/features/billing/billing-sidebar-state";
import { isPaidSubscriptionStatus } from "@/server/permissions/entitlements";

export type { BillingSidebarState };

/** Resolves sidebar / navbar plan UI from the logged-in user's subscription (never the active workspace). */
export async function getBillingSidebarState(userId: string): Promise<BillingSidebarState> {
  const subscription = await getSubscriptionForUser(userId);
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
