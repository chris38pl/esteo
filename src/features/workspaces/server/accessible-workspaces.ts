import type { Workspace } from "@prisma/client";

import { prisma } from "@/db/client";

export type AccessibleWorkspace = Workspace;

function dedupeWorkspacesOrdered(
  owned: AccessibleWorkspace[],
  member: AccessibleWorkspace[],
): AccessibleWorkspace[] {
  const seen = new Set<string>();
  const result: AccessibleWorkspace[] = [];

  for (const workspace of [...owned, ...member]) {
    if (seen.has(workspace.id)) {
      continue;
    }
    seen.add(workspace.id);
    result.push(workspace);
  }

  return result;
}

/** Owner path is independent of WorkspaceMember rows. */
export async function getAccessibleWorkspaces(
  userId: string,
): Promise<AccessibleWorkspace[]> {
  const [owned, member] = await Promise.all([
    prisma.workspace.findMany({
      where: { ownerId: userId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workspace.findMany({
      where: {
        deletedAt: null,
        members: {
          some: { userId, deletedAt: null },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return dedupeWorkspacesOrdered(owned, member);
}

export async function countAccessibleWorkspaces(userId: string): Promise<number> {
  const workspaces = await getAccessibleWorkspaces(userId);
  return workspaces.length;
}

export function getFirstOwnedWorkspace(
  workspaces: AccessibleWorkspace[],
  userId: string,
): AccessibleWorkspace | undefined {
  return workspaces.find((workspace) => workspace.ownerId === userId);
}

export function getFirstMembershipOnlyWorkspace(
  workspaces: AccessibleWorkspace[],
  userId: string,
): AccessibleWorkspace | undefined {
  return workspaces.find((workspace) => workspace.ownerId !== userId);
}
