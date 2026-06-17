import type { SubscriptionStatus } from "@prisma/client";

export type BillingSidebarState =
  | {
      variant: "upsell";
      currentPlan: "FREE" | "PRO";
      targetPlan: "PRO" | "BUSINESS";
    }
  | {
      variant: "status";
      plan: "BUSINESS";
      status: SubscriptionStatus;
    };

export function resolveBillingPlanCode(
  state: BillingSidebarState,
): "FREE" | "PRO" | "BUSINESS" {
  return state.variant === "status" ? state.plan : state.currentPlan;
}
