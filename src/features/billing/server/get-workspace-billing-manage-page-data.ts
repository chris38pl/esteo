import "server-only";

import type { WorkspaceBillingManagePageData } from "@/features/billing/billing-manage-page-data";
import { getWorkspaceBillingPlansPageData } from "@/features/billing/server/get-workspace-billing-plans-page-data";
import { getWorkspaceEntitlements } from "@/server/billing/entitlement-service";

export async function getWorkspaceBillingManagePageData(
  workspaceId: string,
): Promise<WorkspaceBillingManagePageData> {
  const [plansData, entitlements] = await Promise.all([
    getWorkspaceBillingPlansPageData(workspaceId),
    getWorkspaceEntitlements(workspaceId),
  ]);

  return {
    ...plansData,
    entitlements,
  };
}
