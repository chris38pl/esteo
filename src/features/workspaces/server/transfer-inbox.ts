import { prisma } from "@/db/client";

import { expireStalePendingTransfers } from "@/features/workspaces/server/ownership-transfer";

const pendingTransferWhere = (email: string) => ({
  toEmail: email.toLowerCase(),
  status: "PENDING_RECIPIENT" as const,
  expiresAt: { gt: new Date() },
  workspace: { deletedAt: null },
});

export async function listReceivedOwnershipTransfers(email: string) {
  await expireStalePendingTransfers();

  return prisma.workspaceOwnershipTransfer.findMany({
    where: pendingTransferWhere(email),
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      fromUser: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function countPendingOwnershipTransfers(email: string): Promise<number> {
  await expireStalePendingTransfers();

  return prisma.workspaceOwnershipTransfer.count({
    where: pendingTransferWhere(email),
  });
}

export async function hasPendingOwnershipTransfers(email: string): Promise<boolean> {
  const count = await countPendingOwnershipTransfers(email);
  return count > 0;
}
