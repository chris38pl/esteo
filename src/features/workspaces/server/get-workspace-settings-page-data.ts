import type { User } from "@prisma/client";

import {
  findWorkspaceById,
  listPendingWorkspaceInvitations,
} from "@/features/workspaces/server/repository";
import {
  getWorkspaceMembersForUi,
  listWorkspaceRules,
} from "@/features/workspaces/server/service";
import { getPendingWorkspaceTransfer } from "@/features/workspaces/server/ownership-transfer";
import {
  getTransferEligibilitySnapshot,
  loadLiveSubscriptionForTransfer,
} from "@/features/workspaces/server/transfer-eligibility";
import { getWorkspaceBillingOwnershipState } from "@/features/billing/server/billing-permissions";
import { evaluateWorkspaceDeleteEligibility } from "@/features/workspaces/lib/workspace-delete-eligibility";
import { canInviteWorkspaceMembers } from "@/server/permissions/entitlements";

export type WorkspaceSettingsPageData = {
  workspace: NonNullable<Awaited<ReturnType<typeof findWorkspaceById>>>;
  members: Awaited<ReturnType<typeof getWorkspaceMembersForUi>>;
  invitations: Awaited<ReturnType<typeof listPendingWorkspaceInvitations>>;
  rules: Awaited<ReturnType<typeof listWorkspaceRules>>;
  canInviteMembers: boolean;
  transferEligibility: Awaited<ReturnType<typeof getTransferEligibilitySnapshot>>;
  pendingTransfer: Awaited<ReturnType<typeof getPendingWorkspaceTransfer>>;
  deleteEligibility: ReturnType<typeof evaluateWorkspaceDeleteEligibility>;
};

export async function getWorkspaceSettingsPageData(
  user: User,
  workspaceId: string,
): Promise<WorkspaceSettingsPageData | null> {
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    return null;
  }

  const [
    members,
    invitations,
    rules,
    canInviteMembers,
    transferEligibility,
    pendingTransfer,
    subscription,
    billingOwnershipState,
  ] = await Promise.all([
    getWorkspaceMembersForUi(user, workspaceId),
    listPendingWorkspaceInvitations(workspaceId),
    listWorkspaceRules(user, workspaceId),
    canInviteWorkspaceMembers(workspaceId),
    getTransferEligibilitySnapshot(workspaceId),
    getPendingWorkspaceTransfer(workspaceId),
    loadLiveSubscriptionForTransfer(workspaceId),
    getWorkspaceBillingOwnershipState(workspaceId),
  ]);

  const deleteEligibility = evaluateWorkspaceDeleteEligibility({
    subscription,
    hasPendingTransfer: Boolean(pendingTransfer),
    billingOwnershipState: billingOwnershipState ?? "NORMAL",
  });

  return {
    workspace,
    members,
    invitations,
    rules,
    canInviteMembers,
    transferEligibility,
    pendingTransfer,
    deleteEligibility,
  };
}
