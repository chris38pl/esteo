import "server-only";

import { prisma } from "@/db/client";

export async function countOwnedWorkspaces(userId: string): Promise<number> {
  return prisma.workspace.count({
    where: { ownerId: userId, deletedAt: null },
  });
}
