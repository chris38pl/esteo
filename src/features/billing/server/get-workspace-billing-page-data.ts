import "server-only";

import { prisma } from "@/db/client";
import { getWorkspaceEntitlements } from "@/server/billing/entitlement-service";
import { getSeatOverageState } from "@/server/billing/seat-overage";
import { loadWorkspaceMemberUsage } from "@/features/billing/server/load-workspace-member-usage";
import { loadWorkspaceStorageUsage } from "@/features/billing/server/load-workspace-storage-usage";
import { getWorkspaceUpcomingInvoice } from "@/features/billing/server/get-workspace-upcoming-invoice";
import type {
  WorkspaceBillingMemberUsage,
  WorkspaceBillingPageData,
} from "@/features/billing/billing-page-data";

export type { WorkspaceBillingMemberUsage, WorkspaceBillingPageData };

export async function getWorkspaceBillingPageData(
  workspaceId: string,
): Promise<WorkspaceBillingPageData> {
  const [entitlements, memberUsage, { storage, storageOverLimit }, subscriptionRow, seatState] =
    await Promise.all([
      getWorkspaceEntitlements(workspaceId),
      loadWorkspaceMemberUsage(workspaceId),
      loadWorkspaceStorageUsage(workspaceId),
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: {
          billingAccount: {
            select: {
              subscription: {
                select: {
                  plan: true,
                  cancelAtPeriodEnd: true,
                  currentPeriodEnd: true,
                  stripeSubscriptionId: true,
                  stripeCustomerId: true,
                },
              },
            },
          },
        },
      }),
      getSeatOverageState(workspaceId),
    ]);

  const subscription = subscriptionRow?.billingAccount?.subscription ?? null;
  const nextInvoice = await getWorkspaceUpcomingInvoice(subscription);

  return {
    entitlements,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    memberUsage,
    storage,
    storageOverLimit,
    seatOverLimit: seatState.isOverLimit,
    nextInvoice,
  };
}
