import type { SubscriptionPlan } from "@prisma/client";

import type { PlanLimits } from "@/server/billing/plan-catalog";
import type { WorkspaceEffectiveStatus } from "@/server/permissions/domain";

export type WorkspaceBillingPlansPageData = {
  currentPlan: SubscriptionPlan;
  effectiveStatus: WorkspaceEffectiveStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  planLimits: Record<SubscriptionPlan, PlanLimits>;
  catalogPlanPriceCents: Record<SubscriptionPlan, number>;
};
