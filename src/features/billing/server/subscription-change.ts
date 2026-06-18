import "server-only";

import type { SubscriptionChange, SubscriptionPlan } from "@prisma/client";

import { prisma } from "@/db/client";
import { defaultPlanVersion } from "@/server/billing/plan-catalog";
import type { ActiveSubscriptionChange } from "@/features/billing/billing-page-data";

export type { ActiveSubscriptionChange };

export async function getActiveSubscriptionChange(
  subscriptionId: string,
): Promise<ActiveSubscriptionChange | null> {
  const row = await prisma.subscriptionChange.findFirst({
    where: { subscriptionId, canceledAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!row || row.type !== "PLAN_DOWNGRADE" || !row.targetPlan) {
    return null;
  }

  return {
    id: row.id,
    type: "PLAN_DOWNGRADE",
    targetPlan: row.targetPlan,
    targetPlanVersion: row.targetPlanVersion ?? defaultPlanVersion(row.targetPlan),
    effectiveAt: row.effectiveAt,
  };
}

export async function createPlanDowngradeChange(params: {
  subscriptionId: string;
  targetPlan: SubscriptionPlan;
  effectiveAt: Date;
}): Promise<SubscriptionChange> {
  await cancelActiveSubscriptionChanges(params.subscriptionId);

  return prisma.subscriptionChange.create({
    data: {
      subscriptionId: params.subscriptionId,
      type: "PLAN_DOWNGRADE",
      targetPlan: params.targetPlan,
      targetPlanVersion: defaultPlanVersion(params.targetPlan),
      effectiveAt: params.effectiveAt,
    },
  });
}

export async function cancelActiveSubscriptionChanges(subscriptionId: string): Promise<void> {
  await prisma.subscriptionChange.updateMany({
    where: { subscriptionId, canceledAt: null },
    data: { canceledAt: new Date() },
  });
}
