import "server-only";

import type { SubscriptionPlan } from "@prisma/client";

import type { WorkspaceBillingPlansPageData } from "@/features/billing/billing-plans-page-data";
import { prisma } from "@/db/client";
import { getWorkspaceEntitlements } from "@/server/billing/entitlement-service";
import { resolvePlanLimits } from "@/server/billing/plan-catalog";
import { resolveCurrentPlanPrice } from "@/server/billing/plan-pricing";
import { loadWorkspaceAddonQuantities } from "@/features/billing/server/workspace-addon-sync";
import { getActiveSubscriptionChange } from "@/features/billing/server/subscription-change";
import { addonRowsToQuantities } from "@/features/billing/lib/subscription-impact";

const COMPARISON_PLANS: SubscriptionPlan[] = ["FREE", "PRO", "BUSINESS"];

export async function getWorkspaceBillingPlansPageData(
  workspaceId: string,
): Promise<WorkspaceBillingPlansPageData> {
  const [entitlements, subscriptionRow, addonRows] = await Promise.all([
    getWorkspaceEntitlements(workspaceId),
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        billingAccount: {
          select: {
            subscription: {
              select: {
                id: true,
                cancelAtPeriodEnd: true,
                currentPeriodEnd: true,
              },
            },
          },
        },
      },
    }),
    loadWorkspaceAddonQuantities(workspaceId),
  ]);

  const subscription = subscriptionRow?.billingAccount?.subscription ?? null;
  const addonQuantities = addonRowsToQuantities(addonRows);
  const activeSubscriptionChange = subscription
    ? await getActiveSubscriptionChange(subscription.id)
    : null;

  const planLimits = Object.fromEntries(
    COMPARISON_PLANS.map((plan) => [plan, resolvePlanLimits(plan)]),
  ) as Record<SubscriptionPlan, ReturnType<typeof resolvePlanLimits>>;

  const catalogPlanPriceCents = Object.fromEntries(
    COMPARISON_PLANS.map((plan) => [plan, resolveCurrentPlanPrice(plan)]),
  ) as Record<SubscriptionPlan, number>;

  return {
    currentPlan: entitlements.plan,
    effectiveStatus: entitlements.effectiveStatus,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    planLimits,
    catalogPlanPriceCents,
    addonQuantities,
    activeSubscriptionChange,
  };
}
