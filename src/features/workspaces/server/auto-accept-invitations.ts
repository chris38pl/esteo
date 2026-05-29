import type { User, WorkspaceInvitation } from "@prisma/client";

import { prisma } from "@/db/client";
import {
  acceptInvitationRecord,
  logAuditEvent,
} from "@/features/workspaces/server/repository";
import {
  assertCanInviteMember,
  countInvitedSeats,
  getEntitlements,
} from "@/server/permissions/entitlements";
import { EntitlementError } from "@/server/permissions/errors";

export type AutoAcceptResult = {
  accepted: string[];
  seatLimitBlocked: string[];
  expired: string[];
  skipped: string[];
};

async function isActiveMember(userId: string, workspaceId: string): Promise<boolean> {
  const member = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId, deletedAt: null },
  });
  return member !== null;
}

/**
 * Invitation processing order must remain stable and deterministic.
 * Query and process pending invitations ORDER BY createdAt ASC — do not change.
 */
export async function autoAcceptPendingInvitations(
  user: User,
): Promise<AutoAcceptResult> {
  const email = user.email.toLowerCase();
  const now = new Date();

  const invitations = await prisma.workspaceInvitation.findMany({
    where: {
      email,
      status: "PENDING",
      expiresAt: { gt: now },
      workspace: { deletedAt: null },
    },
    orderBy: { createdAt: "asc" },
  });

  const result: AutoAcceptResult = {
    accepted: [],
    seatLimitBlocked: [],
    expired: [],
    skipped: [],
  };

  for (const invitation of invitations) {
    await processInvitation(user, invitation, result);
  }

  return result;
}

async function processInvitation(
  user: User,
  invitation: WorkspaceInvitation,
  result: AutoAcceptResult,
): Promise<void> {
  if (invitation.expiresAt <= new Date()) {
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    result.expired.push(invitation.id);
    return;
  }

  if (await isActiveMember(user.id, invitation.workspaceId)) {
    if (invitation.status === "PENDING") {
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });
    }
    result.skipped.push(invitation.id);
    return;
  }

  try {
    await assertCanInviteMember(invitation.workspaceId);
  } catch (error) {
    if (error instanceof EntitlementError) {
      result.seatLimitBlocked.push(invitation.id);
      return;
    }
    throw error;
  }

  await acceptInvitationRecord({
    invitationId: invitation.id,
    workspaceId: invitation.workspaceId,
    userId: user.id,
    role: invitation.role,
    invitedById: invitation.invitedById,
  });

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId: invitation.workspaceId,
    entityType: "WorkspaceInvitation",
    entityId: invitation.id,
    action: "auto_accepted",
  });

  result.accepted.push(invitation.id);
}

/** DB-derived check for pending-access redirect (fresh on each request). */
export async function hasSeatBlockedPendingInvite(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase();
  const now = new Date();

  const pendingInvites = await prisma.workspaceInvitation.findMany({
    where: {
      email: normalizedEmail,
      status: "PENDING",
      expiresAt: { gt: now },
      workspace: { deletedAt: null },
    },
    include: {
      workspace: {
        include: {
          billingAccount: { include: { subscription: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (pendingInvites.length === 0) {
    return false;
  }

  for (const invitation of pendingInvites) {
    const subscription = invitation.workspace.billingAccount.subscription;
    if (!subscription) {
      continue;
    }

    const entitlements = getEntitlements(subscription.plan);
    if (entitlements.maxInvitedSeats === null) {
      return false;
    }

    const invitedSeats = await countInvitedSeats(invitation.workspaceId);
    if (invitedSeats >= entitlements.maxInvitedSeats) {
      return true;
    }
  }

  return false;
}
