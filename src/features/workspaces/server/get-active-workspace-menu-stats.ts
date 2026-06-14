import "server-only";

import { prisma } from "@/db/client";

export type ActiveWorkspaceMenuStats = {
  requestCount: number;
  estimateCount: number;
};

export async function getActiveWorkspaceMenuStats(
  workspaceId: string,
): Promise<ActiveWorkspaceMenuStats> {
  const [requestCount, estimateCount] = await Promise.all([
    prisma.estimateRequest.count({
      where: { workspaceId, deletedAt: null },
    }),
    prisma.estimate.count({
      where: { workspaceId, deletedAt: null },
    }),
  ]);

  return { requestCount, estimateCount };
}
