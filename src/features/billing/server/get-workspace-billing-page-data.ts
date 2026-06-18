import "server-only";

import { prisma } from "@/db/client";
import { getWorkspaceEntitlements } from "@/server/billing/entitlement-service";
import { getSeatOverageState } from "@/server/billing/seat-overage";
import { loadWorkspaceMemberUsage } from "@/features/billing/server/load-workspace-member-usage";
import { loadWorkspaceStorageUsage } from "@/features/billing/server/load-workspace-storage-usage";
import { loadWorkspaceAddonQuantities } from "@/features/billing/server/workspace-addon-sync";
import {
  buildWorkspaceBillingPricing,
} from "@/features/billing/server/get-workspace-upcoming-invoice";
import { getActiveSubscriptionChange } from "@/features/billing/server/subscription-change";
import { addonRowsToQuantities } from "@/features/billing/lib/subscription-impact";
import type {
  WorkspaceBillingMemberUsage,
  WorkspaceBillingPageData,
} from "@/features/billing/billing-page-data";

export type { WorkspaceBillingMemberUsage, WorkspaceBillingPageData };

export async function getWorkspaceBillingPageData(
  workspaceId: string,
): Promise<
  Omit<
    WorkspaceBillingPageData,
    | "canManageBilling"
    | "canChangePlanOrAddons"
    | "canPurchaseSubscription"
    | "canResumeSubscription"
    | "billingHandoffActive"
    | "billingOwnershipState"
  >
> {
  const [entitlements, memberUsage, { storage, storageOverLimit }, workspaceRow, addonRows, seatState] =
    await Promise.all([
      getWorkspaceEntitlements(workspaceId),
      loadWorkspaceMemberUsage(workspaceId),
      loadWorkspaceStorageUsage(workspaceId),
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: {
          slug: true,
          billingAccount: {
            select: {
              subscription: {
                select: {
                  id: true,
                  plan: true,
                  planVersion: true,
                  cancelAtPeriodEnd: true,
                  currentPeriodEnd: true,
                  stripeSubscriptionId: true,
                  stripeCustomerId: true,
                },
              },
            },
          },
        },
      }),
      loadWorkspaceAddonQuantities(workspaceId),
      getSeatOverageState(workspaceId),
    ]);

  const subscription = workspaceRow?.billingAccount?.subscription ?? null;
  const addonQuantities = addonRowsToQuantities(addonRows);

  const [pricingBundle, activeSubscriptionChange] = await Promise.all([
    buildWorkspaceBillingPricing({
      workspaceId,
      workspaceSlug: workspaceRow?.slug ?? workspaceId,
      subscription,
      addonRows,
    }),
    subscription
      ? getActiveSubscriptionChange(subscription.id)
      : Promise.resolve(null),
  ]);

  const { pricing, nextInvoice } = pricingBundle;

  return {
    entitlements,
    pricing,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    memberUsage,
    storage,
    storageOverLimit,
    seatOverLimit: seatState.isOverLimit,
    nextInvoice,
    activeSubscriptionChange,
    addonQuantities,
  };
}
