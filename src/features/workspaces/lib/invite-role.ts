import type { InviteRole, WorkspaceRole } from "@prisma/client";

/** Maps invitation role to workspace membership role. OWNER is never invitable. */
export function inviteRoleToWorkspaceRole(role: InviteRole): WorkspaceRole {
  return role;
}

export const INVITE_ROLES: InviteRole[] = ["MEMBER", "VIEWER"];
