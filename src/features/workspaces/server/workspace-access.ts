import { prisma } from "@/db/client";

/**
 * Returns whether a user can access a workspace (owner or active member).
 * Lightweight check by workspace id — does not resolve slug or load full workspace data.
 */
export async function viewerHasWorkspaceAccess(
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
    select: { ownerId: true },
  });

  if (!workspace) {
    return false;
  }

  if (workspace.ownerId === userId) {
    return true;
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId,
      deletedAt: null,
    },
    select: { id: true },
  });

  return membership !== null;
}
