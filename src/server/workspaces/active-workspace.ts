import { cache } from "react";
import { cookies } from "next/headers";

import { prisma } from "@/db/client";
import {
  getAccessibleWorkspaces,
  getFirstMembershipOnlyWorkspace,
  getFirstOwnedWorkspace,
} from "@/features/workspaces/server/accessible-workspaces";
import { ACTIVE_WORKSPACE_COOKIE } from "@/server/workspaces/constants";
import type { Workspace } from "@prisma/client";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export async function getActiveWorkspaceCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
}

export async function setActiveWorkspaceCookie(workspaceId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, COOKIE_OPTIONS);
}

export async function clearActiveWorkspaceCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_WORKSPACE_COOKIE);
}

async function clearLastActiveWorkspace(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastActiveWorkspaceId: null },
  });
}

/**
 * Clears stale cookie / lastActive values. Must only run in Server Actions or Route Handlers
 * — never during Server Component render (Next.js forbids cookie mutation there).
 */
export async function reconcileStaleActiveWorkspace(userId: string): Promise<void> {
  const accessible = await getAccessibleWorkspaces(userId);

  if (accessible.length === 0) {
    await clearActiveWorkspaceCookie();
    await clearLastActiveWorkspace(userId);
    return;
  }

  const accessibleIds = new Set(accessible.map((workspace) => workspace.id));
  const cookieValue = await getActiveWorkspaceCookie();

  if (cookieValue && !accessibleIds.has(cookieValue)) {
    await clearActiveWorkspaceCookie();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastActiveWorkspaceId: true },
  });

  if (user?.lastActiveWorkspaceId && !accessibleIds.has(user.lastActiveWorkspaceId)) {
    await clearLastActiveWorkspace(userId);
  }
}

/** Read-only resolution for layouts: cookie → lastActive → first owned → first membership-only. */
export async function resolveActiveWorkspace(userId: string): Promise<string | null> {
  const accessible = await getAccessibleWorkspaces(userId);

  if (accessible.length === 0) {
    return null;
  }

  const accessibleIds = new Set(accessible.map((workspace) => workspace.id));
  const cookieValue = await getActiveWorkspaceCookie();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastActiveWorkspaceId: true },
  });
  const lastActiveId = user?.lastActiveWorkspaceId ?? null;

  if (cookieValue && accessibleIds.has(cookieValue)) {
    return cookieValue;
  }

  if (lastActiveId && accessibleIds.has(lastActiveId)) {
    return lastActiveId;
  }

  const owned = getFirstOwnedWorkspace(accessible, userId);
  if (owned) {
    return owned.id;
  }

  const memberOnly = getFirstMembershipOnlyWorkspace(accessible, userId);
  if (memberOnly) {
    return memberOnly.id;
  }

  return accessible[0]?.id ?? null;
}

export async function persistActiveWorkspace(
  userId: string,
  workspaceId: string,
): Promise<void> {
  await reconcileStaleActiveWorkspace(userId);
  await setActiveWorkspaceCookie(workspaceId);
  await prisma.user.update({
    where: { id: userId },
    data: { lastActiveWorkspaceId: workspaceId },
  });
}

export async function isWorkspaceAccessible(
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  const accessible = await getAccessibleWorkspaces(userId);
  return accessible.some((workspace) => workspace.id === workspaceId);
}

export type ResolvedWorkspaceBySlug = {
  workspace: Workspace;
  /** Always the current canonical slug (Workspace.slug). */
  canonicalSlug: string;
  /** True when the URL slug matched a WorkspaceSlugAlias, not the current Workspace.slug. */
  matchedViaAlias: boolean;
};

/**
 * Resolves a workspace by URL slug.
 *
 * Lookup order:
 *  1. Direct match on Workspace.slug for accessible workspaces.
 *  2. Match on WorkspaceSlugAlias.slug (old slug after rename).
 *
 * Returns null if the slug is unknown or the user has no access to the matched workspace.
 *
 * Memoised via React cache() so the outer (dashboard) layout and the inner
 * [workspaceSlug] layout share one DB round-trip per request.
 */
export const resolveWorkspaceBySlug = cache(
  async (slug: string, userId: string): Promise<ResolvedWorkspaceBySlug | null> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { platformRole: true },
    });

    if (user?.platformRole === "PLATFORM_ADMIN") {
      const workspace = await prisma.workspace.findFirst({
        where: { slug, deletedAt: null },
      });

      if (workspace) {
        return { workspace, canonicalSlug: workspace.slug, matchedViaAlias: false };
      }

      const alias = await prisma.workspaceSlugAlias.findUnique({
        where: { slug },
        include: { workspace: true },
      });

      if (!alias || alias.workspace.deletedAt) {
        return null;
      }

      return {
        workspace: alias.workspace,
        canonicalSlug: alias.workspace.slug,
        matchedViaAlias: true,
      };
    }

    const accessible = await getAccessibleWorkspaces(userId);

    // 1. Direct slug match among accessible workspaces
    const direct = accessible.find((w) => w.slug === slug);
    if (direct) {
      return { workspace: direct, canonicalSlug: direct.slug, matchedViaAlias: false };
    }

    // 2. Alias lookup
    const alias = await prisma.workspaceSlugAlias.findUnique({
      where: { slug },
      include: { workspace: true },
    });

    if (!alias || alias.workspace.deletedAt) {
      return null;
    }

    const isAccessible = accessible.some((w) => w.id === alias.workspaceId);
    if (!isAccessible) {
      return null;
    }

    return {
      workspace: alias.workspace,
      canonicalSlug: alias.workspace.slug,
      matchedViaAlias: true,
    };
  },
);
