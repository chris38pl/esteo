import type { WorkspaceEntitlements } from "@/server/billing/entitlement-service";
import type { AddonQuantities } from "@/features/billing/lib/subscription-impact";

export type WorkspaceBillingAddonsPageData = {
  entitlements: WorkspaceEntitlements;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  addonQuantities: AddonQuantities;
};
