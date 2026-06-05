import { prisma } from "@/db/client";

/**
 * Static URL segments directly under /dashboard that cannot be used as workspace slugs.
 * Any slug matching one of these would collide with a real route.
 */
export const RESERVED_DASHBOARD_SLUGS = new Set([
  "admin",
  "account",
  "billing",
  "onboarding",
  "invitations",
  "pending-access",
  "workspaces",
]);

/**
 * Returns true if the slug is not already taken by any Workspace or WorkspaceSlugAlias row,
 * and is not a reserved dashboard segment.
 *
 * Pass `excludeWorkspaceId` when renaming an existing workspace so its own current slug
 * and aliases do not block the rename.
 */
export async function isSlugAvailable(
  slug: string,
  excludeWorkspaceId?: string,
): Promise<boolean> {
  if (RESERVED_DASHBOARD_SLUGS.has(slug)) {
    return false;
  }

  const [existingWorkspace, existingAlias] = await Promise.all([
    prisma.workspace.findUnique({ where: { slug } }),
    prisma.workspaceSlugAlias.findUnique({ where: { slug } }),
  ]);

  if (existingWorkspace && existingWorkspace.id !== excludeWorkspaceId) {
    return false;
  }

  if (existingAlias && existingAlias.workspaceId !== excludeWorkspaceId) {
    return false;
  }

  return true;
}

/**
 * Records oldSlug as a permanent alias for the workspace.
 * A no-op if the alias already exists for this workspace (idempotent).
 * Raises if oldSlug is taken by a DIFFERENT workspace (invariant violation).
 */
export async function recordSlugAlias(workspaceId: string, oldSlug: string): Promise<void> {
  await prisma.workspaceSlugAlias.upsert({
    where: { slug: oldSlug },
    create: { workspaceId, slug: oldSlug },
    update: {},
  });
}
