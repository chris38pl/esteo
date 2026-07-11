import "server-only";

import { prisma } from "@/db/client";
import type { WorkspaceBillingMemberUsage } from "@/features/billing/billing-page-data";
import { getPerUserMeterUsage } from "@/server/billing/usage-service";

export async function loadWorkspaceMemberUsage(
  workspaceId: string,
): Promise<WorkspaceBillingMemberUsage[]> {
  const [aiByUser, estimatesByUser] = await Promise.all([
    getPerUserMeterUsage(workspaceId, "AI_ASSISTANT_CALL"),
    getPerUserMeterUsage(workspaceId, "ESTIMATE_CREATED"),
  ]);

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

  return userIds
    .map((userId) => {
      const user = usersById.get(userId);
      return {
        userId,
        name: user?.name ?? null,
        email: user?.email ?? "-",
        aiCalls: aiByUser.find((r) => r.userId === userId)?.quantity ?? 0,
        estimates: estimatesByUserId.get(userId) ?? 0,
      };
    })
    .sort((a, b) => b.aiCalls + b.estimates - (a.aiCalls + a.estimates));
}
