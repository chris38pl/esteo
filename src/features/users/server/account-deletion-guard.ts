import { prisma } from "@/db/client";

export type OwnedWorkspaceBlockingDeletion = {
  id: string;
  name: string;
  slug: string;
  plan: string;
};

/**
 * Users who own workspaces cannot delete their account until every owned workspace is
 * transferred or deleted (and paid subscriptions cancelled).
 */
export async function getOwnedWorkspacesBlockingDeletion(
  userId: string,
): Promise<OwnedWorkspaceBlockingDeletion[]> {
  const workspaces = await prisma.workspace.findMany({
    where: { ownerId: userId, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      billingAccount: { select: { subscription: { select: { plan: true, status: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  return workspaces.map((w) => ({
    id: w.id,
    name: w.name,
    slug: w.slug,
    plan: w.billingAccount?.subscription?.plan ?? "FREE",
  }));
}

export async function assertUserCanDeleteAccount(userId: string): Promise<void> {
  const blocking = await getOwnedWorkspacesBlockingDeletion(userId);

  if (blocking.length > 0) {
    throw new Error(
      "You must transfer or delete all owned workspaces before deleting your account.",
    );
  }
}
