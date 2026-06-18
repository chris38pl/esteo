import type { SubscriptionPlan } from "@prisma/client";

import type { PlanLimits } from "@/server/billing/plan-catalog";
import type { WorkspaceEffectiveStatus } from "@/server/permissions/domain";
import type { ActiveSubscriptionChange } from "@/features/billing/billing-page-data";
import type { AddonQuantities } from "@/features/billing/lib/subscription-impact";

export type WorkspaceBillingPlansPageData = {
  currentPlan: SubscriptionPlan;
  effectiveStatus: WorkspaceEffectiveStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  planLimits: Record<SubscriptionPlan, PlanLimits>;
  catalogPlanPriceCents: Record<SubscriptionPlan, number>;
  addonQuantities: AddonQuantities;
  activeSubscriptionChange: ActiveSubscriptionChange | null;
};
