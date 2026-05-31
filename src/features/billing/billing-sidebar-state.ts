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
