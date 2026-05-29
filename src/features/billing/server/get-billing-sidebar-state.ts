import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

import { getSubscriptionForUser } from "@/features/billing/server/provision-billing-account";
import type { BillingSidebarState } from "@/features/billing/billing-sidebar-state";
import {
  countOwnedWorkspaces,
  isPaidSubscriptionStatus,
} from "@/server/permissions/entitlements";

export type { BillingSidebarState };

export async function getBillingSidebarState(userId: string): Promise<BillingSidebarState> {
  const ownedCount = await countOwnedWorkspaces(userId);

  if (ownedCount === 0) {
    return { variant: "hidden" };
  }

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
