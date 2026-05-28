import type { WorkspaceRole } from "@prisma/client";

/** OWNER > MEMBER > VIEWER */
export const WORKSPACE_ROLE_RANK: Record<WorkspaceRole, number> = {
  OWNER: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export function hasMinimumRole(
  actual: WorkspaceRole,
  minimum: WorkspaceRole,
): boolean {
  return WORKSPACE_ROLE_RANK[actual] >= WORKSPACE_ROLE_RANK[minimum];
}

export function compareRoles(a: WorkspaceRole, b: WorkspaceRole): number {
  return WORKSPACE_ROLE_RANK[a] - WORKSPACE_ROLE_RANK[b];
}
