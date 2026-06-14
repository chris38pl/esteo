import "server-only";

import type { SubscriptionPlan } from "@prisma/client";

import type { WorkspaceBillingPlansPageData } from "@/features/billing/billing-plans-page-data";
import { prisma } from "@/db/client";
import { getWorkspaceEntitlements } from "@/server/billing/entitlement-service";
import { resolvePlanLimits } from "@/server/billing/plan-catalog";

const COMPARISON_PLANS: SubscriptionPlan[] = ["FREE", "PRO", "BUSINESS"];

export async function getWorkspaceBillingPlansPageData(
  workspaceId: string,
): Promise<WorkspaceBillingPlansPageData> {
  const [entitlements, subscriptionRow] = await Promise.all([
    getWorkspaceEntitlements(workspaceId),
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        billingAccount: {
          select: {
            subscription: {
              select: {
                cancelAtPeriodEnd: true,
                currentPeriodEnd: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const subscription = subscriptionRow?.billingAccount?.subscription ?? null;

  const planLimits = Object.fromEntries(
    COMPARISON_PLANS.map((plan) => [plan, resolvePlanLimits(plan)]),
  ) as Record<SubscriptionPlan, ReturnType<typeof resolvePlanLimits>>;

  return {
    currentPlan: entitlements.plan,
    effectiveStatus: entitlements.effectiveStatus,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    planLimits,
  };
}
