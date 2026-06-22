import type { PlatformRole, User, WorkspaceMember } from "@prisma/client";

import { prisma } from "@/db/client";
import { PermissionError } from "@/server/permissions/errors";
import { hasMinimumRole } from "@/server/permissions/roles";

export type WorkspaceContext = {
  user: User;
  membership: WorkspaceMember;
};

export function isPlatformAdmin(user: User): boolean {
  return user.platformRole === ("PLATFORM_ADMIN" satisfies PlatformRole);
}

export function isQaTester(user: User): boolean {
  return user.platformRole === ("QA_TESTER" satisfies PlatformRole);
}

export function hasProductPlatformRole(user: User): boolean {
  return user.platformRole !== ("NONE" satisfies PlatformRole);
}

export function canAccessIssueTriage(user: User): boolean {
  return isPlatformAdmin(user) || isQaTester(user);
}

export async function getWorkspaceMembership(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceMember | null> {
  return prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId,
      deletedAt: null,
      workspace: { deletedAt: null },
    },
  });
}

export async function requireWorkspace(
  user: User,
  workspaceId: string,
): Promise<WorkspaceContext> {
  if (isPlatformAdmin(user)) {
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, deletedAt: null },
    });

    if (!workspace) {
      throw new PermissionError("Workspace not found.");
    }

    const membership = await getWorkspaceMembership(user.id, workspaceId);

    if (membership) {
      return { user, membership };
    }

    return {
      user,
      membership: {
        id: "platform-admin",
        workspaceId,
        userId: user.id,
        role: "OWNER",
        state: "ACTIVE",
        suspendedReason: null,
        suspendedAt: null,
        invitedById: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
  });

  if (!workspace) {
    throw new PermissionError("Workspace not found.");
  }

  if (workspace.ownerId === user.id) {
    const membership = await getWorkspaceMembership(user.id, workspaceId);

    if (membership) {
      return { user, membership };
    }

    return {
      user,
      membership: {
        id: "workspace-owner",
        workspaceId,
        userId: user.id,
        role: "OWNER",
        state: "ACTIVE",
        suspendedReason: null,
        suspendedAt: null,
        invitedById: null,
        deletedAt: null,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      },
    };
  }

  const membership = await getWorkspaceMembership(user.id, workspaceId);

  if (!membership) {
    throw new PermissionError("You are not a member of this workspace.");
  }

  return { user, membership };
}

export async function requireRole(
  user: User,
  workspaceId: string,
  minimumRole: WorkspaceMember["role"],
): Promise<WorkspaceContext> {
  const context = await requireWorkspace(user, workspaceId);

  if (!hasMinimumRole(context.membership.role, minimumRole)) {
    throw new PermissionError("Insufficient workspace permissions.");
  }

  return context;
}

/** Exclude platform admins from workspace member listings shown in UI (owner always shown). */
export function filterWorkspaceMembersForUi<
  T extends { user: { platformRole: PlatformRole }; role: WorkspaceMember["role"] },
>(members: T[]): T[] {
  return members.filter(
    (member) => member.role === "OWNER" || member.user.platformRole !== "PLATFORM_ADMIN",
  );
}
