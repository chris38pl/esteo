import type { User, WorkspaceInvitation, WorkspaceRule } from "@prisma/client";

import {
  findWorkspaceById,
  listPendingWorkspaceInvitations,
} from "@/features/workspaces/server/repository";
import {
  getWorkspaceMembersForUi,
  listWorkspaceRules,
} from "@/features/workspaces/server/service";
import { canInviteWorkspaceMembers } from "@/server/permissions/entitlements";

export type WorkspaceSettingsPageData = {
  workspace: NonNullable<Awaited<ReturnType<typeof findWorkspaceById>>>;
  members: Awaited<ReturnType<typeof getWorkspaceMembersForUi>>;
  invitations: WorkspaceInvitation[];
  rules: WorkspaceRule[];
  canInviteMembers: boolean;
};

export async function getWorkspaceSettingsPageData(
  user: User,
  workspaceId: string,
): Promise<WorkspaceSettingsPageData | null> {
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    return null;
  }

  const [members, invitations, rules, canInviteMembers] = await Promise.all([
    getWorkspaceMembersForUi(user, workspaceId),
    listPendingWorkspaceInvitations(workspaceId),
    listWorkspaceRules(user, workspaceId),
    canInviteWorkspaceMembers(workspaceId),
  ]);

  return { workspace, members, invitations, rules, canInviteMembers };
}
