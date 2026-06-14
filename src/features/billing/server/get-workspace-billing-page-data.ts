import "server-only";

import { prisma } from "@/db/client";
import { getPerUserMeterUsage } from "@/server/billing/usage-service";
import { getWorkspaceEntitlements } from "@/server/billing/entitlement-service";
import { getSeatOverageState } from "@/server/billing/seat-overage";
import { getWorkspaceStorageSummary } from "@/features/attachments/server/assert-workspace-storage";
import { getWorkspaceUpcomingInvoice } from "@/features/billing/server/get-workspace-upcoming-invoice";
import type {
  WorkspaceBillingMemberUsage,
  WorkspaceBillingPageData,
} from "@/features/billing/billing-page-data";

export type { WorkspaceBillingMemberUsage, WorkspaceBillingPageData };

export async function getWorkspaceBillingPageData(
  workspaceId: string,
): Promise<WorkspaceBillingPageData> {
  const [entitlements, aiByUser, estimatesByUser, storageRow, seatState] = await Promise.all([
    getWorkspaceEntitlements(workspaceId),
    getPerUserMeterUsage(workspaceId, "AI_ASSISTANT_CALL"),
    getPerUserMeterUsage(workspaceId, "ESTIMATE_CREATED"),
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        attachmentStorageUsedBytes: true,
        attachmentStorageLimitBytes: true,
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

  const storageSummary =
    storageRow != null ? getWorkspaceStorageSummary(storageRow) : null;

  const storageOverLimit = storageSummary?.level === "exhausted";

  const estimatesByUserId = new Map(estimatesByUser.map((row) => [row.userId, row.quantity]));
  const userIds = Array.from(
    new Set([...aiByUser.map((r) => r.userId), ...estimatesByUser.map((r) => r.userId)]),
  );

  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const usersById = new Map(users.map((u) => [u.id, u]));

  const memberUsage: WorkspaceBillingMemberUsage[] = userIds
    .map((userId) => {
      const user = usersById.get(userId);
      return {
        userId,
        name: user?.name ?? null,
        email: user?.email ?? "—",
        aiCalls: aiByUser.find((r) => r.userId === userId)?.quantity ?? 0,
        estimates: estimatesByUserId.get(userId) ?? 0,
      };
    })
    .sort((a, b) => b.aiCalls - a.aiCalls);

  const subscription = storageRow?.billingAccount?.subscription ?? null;

  const nextInvoice = await getWorkspaceUpcomingInvoice(subscription);

  return {
    entitlements,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    memberUsage,
    storage: {
      usedFormatted: storageSummary?.usedFormatted ?? "0 B",
      limitFormatted: storageSummary?.limitFormatted ?? "0 B",
      usedPercent: storageSummary?.usedPercent ?? 0,
    },
    storageOverLimit,
    seatOverLimit: seatState.isOverLimit,
    nextInvoice,
  };
}
