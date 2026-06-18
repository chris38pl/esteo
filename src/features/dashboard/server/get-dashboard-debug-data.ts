import type { User, Workspace, WorkspaceMember, WorkspaceRole } from "@prisma/client";

import { prisma } from "@/db/client";
import { getAccessibleWorkspaces } from "@/features/workspaces/server/accessible-workspaces";
import { resolveActiveWorkspace } from "@/server/workspaces/active-workspace";

export type WorkspaceDebugEntry = Workspace & {
  accessRole: WorkspaceRole;
  membership: WorkspaceMember | null;
  isOwner: boolean;
};

export type DashboardDebugData = {
  user: User;
  activeWorkspaceId: string | null;
  billingAccount: Awaited<ReturnType<typeof loadBillingAccount>>;
  workspaces: WorkspaceDebugEntry[];
};

async function loadBillingAccount(userId: string) {
  return prisma.billingAccount.findFirst({
    where: {
      workspace: { ownerId: userId, deletedAt: null },
      workspaceId: { not: null },
    },
    include: { subscription: true, billingCustomer: true },
    orderBy: { createdAt: "asc" },
  });
}

function resolveAccessRole(
  workspace: Workspace,
  userId: string,
  membership: WorkspaceMember | undefined,
): WorkspaceRole {
  if (workspace.ownerId === userId) {
    return "OWNER";
  }

  return membership?.role ?? "MEMBER";
}

export async function getDashboardDebugData(user: User): Promise<DashboardDebugData> {
  const [workspaces, activeWorkspaceId, billingAccount, memberships] = await Promise.all([
    getAccessibleWorkspaces(user.id),
    resolveActiveWorkspace(user.id),
    loadBillingAccount(user.id),
    prisma.workspaceMember.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        workspace: { deletedAt: null },
      },
    }),
  ]);

  const membershipByWorkspaceId = new Map(
    memberships.map((membership) => [membership.workspaceId, membership]),
  );

  const workspaceEntries: WorkspaceDebugEntry[] = workspaces.map((workspace) => {
    const membership = membershipByWorkspaceId.get(workspace.id) ?? null;

    return {
      ...workspace,
      membership,
      isOwner: workspace.ownerId === user.id,
      accessRole: resolveAccessRole(workspace, user.id, membership ?? undefined),
    };
  });

  return {
    user,
    activeWorkspaceId,
    billingAccount,
    workspaces: workspaceEntries,
  };
}
