import "server-only";

import { prisma } from "@/db/client";
import { getWorkspaceEntitlements } from "@/server/billing/entitlement-service";
import type { WorkspaceBillingAddonsPageData } from "@/features/billing/billing-addons-page-data";

export async function getWorkspaceBillingAddonsPageData(
  workspaceId: string,
): Promise<WorkspaceBillingAddonsPageData> {
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

  return {
    entitlements,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
  };
}
