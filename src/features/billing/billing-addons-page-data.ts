import type { WorkspaceEntitlements } from "@/server/billing/entitlement-service";

export type WorkspaceBillingAddonsPageData = {
  entitlements: WorkspaceEntitlements;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
};
