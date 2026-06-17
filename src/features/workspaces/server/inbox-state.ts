import {
  countPendingInvitations,
  hasPendingInvitations,
} from "@/features/workspaces/server/invitation-inbox";
import {
  countPendingOwnershipTransfers,
  hasPendingOwnershipTransfers,
} from "@/features/workspaces/server/transfer-inbox";

export async function countPendingInboxItems(email: string): Promise<number> {
  const [invitationCount, transferCount] = await Promise.all([
    countPendingInvitations(email),
    countPendingOwnershipTransfers(email),
  ]);

  return invitationCount + transferCount;
}

export async function hasPendingInboxItems(email: string): Promise<boolean> {
  const [hasInvitations, hasTransfers] = await Promise.all([
    hasPendingInvitations(email),
    hasPendingOwnershipTransfers(email),
  ]);

  return hasInvitations || hasTransfers;
}
