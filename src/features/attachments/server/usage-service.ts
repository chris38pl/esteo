import { prisma } from "@/db/client";

export async function incrementWorkspaceStorageUsed(
  workspaceId: string,
  storedBytes: number,
  tx: Pick<typeof prisma, "workspace"> = prisma,
): Promise<void> {
  if (storedBytes <= 0) {
    return;
  }

  await tx.workspace.update({
    where: { id: workspaceId },
    data: {
      attachmentStorageUsedBytes: {
        increment: BigInt(storedBytes),
      },
    },
  });
}

export async function decrementWorkspaceStorageUsed(
  workspaceId: string,
  storedBytes: number,
  tx: Pick<typeof prisma, "workspace"> = prisma,
): Promise<void> {
  if (storedBytes <= 0) {
    return;
  }

  const workspace = await tx.workspace.findUnique({
    where: { id: workspaceId },
    select: { attachmentStorageUsedBytes: true },
  });

  if (!workspace) {
    return;
  }

  const next = workspace.attachmentStorageUsedBytes - BigInt(storedBytes);
  const clamped = next < BigInt(0) ? BigInt(0) : next;

  await tx.workspace.update({
    where: { id: workspaceId },
    data: { attachmentStorageUsedBytes: clamped },
  });
}
