import "server-only";

import type { User, WorkspaceOwnershipTransfer } from "@prisma/client";
import { randomUUID } from "crypto";

import { prisma } from "@/db/client";
import {
  assertTransferAcceptable,
  assertTransferEligible,
  loadLiveSubscriptionForTransfer,
} from "@/features/workspaces/server/transfer-eligibility";
import { logAuditEvent } from "@/features/workspaces/server/repository";
import { PermissionError, WorkspaceError } from "@/server/permissions/errors";
import { requireRole } from "@/server/permissions/require-workspace";

const TRANSFER_TTL_DAYS = 7;

function normalizeTransferEmail(email: string): string {
  return email.trim().toLowerCase();
}

function transferExpiresAt(): Date {
  return new Date(Date.now() + TRANSFER_TTL_DAYS * 24 * 60 * 60 * 1000);
}

async function assertIsWorkspaceOwner(actor: User, workspaceId: string): Promise<void> {
  await requireRole(actor, workspaceId, "OWNER");

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
    select: { ownerId: true },
  });

  if (!workspace) {
    throw new WorkspaceError("Workspace not found.");
  }

  if (workspace.ownerId !== actor.id) {
    throw new PermissionError("Only the workspace owner can transfer ownership.");
  }
}

async function resolveRecipientUserId(email: string): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: { email: normalizeTransferEmail(email), deletedAt: null },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function expireStalePendingTransfers(workspaceId?: string): Promise<number> {
  const now = new Date();
  const stale = await prisma.workspaceOwnershipTransfer.findMany({
    where: {
      status: "PENDING_RECIPIENT",
      expiresAt: { lte: now },
      ...(workspaceId ? { workspaceId } : {}),
    },
    select: { id: true, workspaceId: true, fromUserId: true },
  });

  if (stale.length === 0) {
    return 0;
  }

  await prisma.workspaceOwnershipTransfer.updateMany({
    where: { id: { in: stale.map((transfer) => transfer.id) } },
    data: { status: "EXPIRED" },
  });

  await Promise.all(
    stale.map((transfer) =>
      logAuditEvent({
        actorUserId: transfer.fromUserId,
        workspaceId: transfer.workspaceId,
        entityType: "WorkspaceOwnershipTransfer",
        entityId: transfer.id,
        action: "transfer_expired",
      }),
    ),
  );

  return stale.length;
}

export async function getPendingWorkspaceTransfer(
  workspaceId: string,
): Promise<WorkspaceOwnershipTransfer | null> {
  await expireStalePendingTransfers(workspaceId);

  return prisma.workspaceOwnershipTransfer.findFirst({
    where: { workspaceId, status: "PENDING_RECIPIENT" },
    orderBy: { createdAt: "desc" },
  });
}

export async function findOwnershipTransferByToken(token: string) {
  return prisma.workspaceOwnershipTransfer.findUnique({
    where: { token },
    include: {
      workspace: { select: { id: true, name: true, slug: true, deletedAt: true } },
      fromUser: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function initiateWorkspaceOwnershipTransfer(
  actor: User,
  workspaceId: string,
  input: { toEmail: string; keepSenderAsMember: boolean },
): Promise<WorkspaceOwnershipTransfer> {
  await assertIsWorkspaceOwner(actor, workspaceId);

  const toEmail = normalizeTransferEmail(input.toEmail);
  if (!toEmail) {
    throw new WorkspaceError("Recipient email is required.");
  }

  if (toEmail === actor.email.toLowerCase()) {
    throw new WorkspaceError("You cannot transfer a workspace to yourself.");
  }

  const eligibility = await assertTransferEligible(workspaceId);
  const subscription = await loadLiveSubscriptionForTransfer(workspaceId);

  if (!subscription?.currentPeriodEnd) {
    throw new WorkspaceError("This workspace has no remaining paid billing period.");
  }

  const toUserId = await resolveRecipientUserId(toEmail);

  const transfer = await prisma.workspaceOwnershipTransfer.create({
    data: {
      workspaceId,
      fromUserId: actor.id,
      toEmail,
      toUserId,
      token: randomUUID(),
      status: "PENDING_RECIPIENT",
      planSnapshot: eligibility.plan,
      periodEndSnapshot: subscription.currentPeriodEnd,
      keepSenderAsMember: input.keepSenderAsMember,
      expiresAt: transferExpiresAt(),
    },
  });

  await logAuditEvent({
    actorUserId: actor.id,
    workspaceId,
    entityType: "WorkspaceOwnershipTransfer",
    entityId: transfer.id,
    action: "transfer_initiated",
    diff: {
      toEmail,
      keepSenderAsMember: input.keepSenderAsMember,
      planSnapshot: eligibility.plan,
    },
  });

  return transfer;
}

export async function cancelWorkspaceOwnershipTransfer(
  actor: User,
  workspaceId: string,
  reason: "owner_cancelled" | "subscription_reactivated" = "owner_cancelled",
): Promise<WorkspaceOwnershipTransfer | null> {
  if (reason === "owner_cancelled") {
    await assertIsWorkspaceOwner(actor, workspaceId);
  } else if (reason !== "subscription_reactivated") {
    throw new WorkspaceError("Invalid cancel reason.");
  }

  const pending = await getPendingWorkspaceTransfer(workspaceId);
  if (!pending) {
    return null;
  }

  const cancelled = await prisma.workspaceOwnershipTransfer.update({
    where: { id: pending.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  });

  await logAuditEvent({
    actorUserId: actor.id,
    workspaceId,
    entityType: "WorkspaceOwnershipTransfer",
    entityId: cancelled.id,
    action: "transfer_cancelled",
    diff: { reason },
  });

  return cancelled;
}

export async function cancelPendingTransferIfSubscriptionReactivated(
  workspaceId: string,
  cancelAtPeriodEnd: boolean,
  actorUserId?: string,
): Promise<void> {
  if (cancelAtPeriodEnd) {
    return;
  }

  const pending = await getPendingWorkspaceTransfer(workspaceId);
  if (!pending) {
    return;
  }

  const cancelled = await prisma.workspaceOwnershipTransfer.update({
    where: { id: pending.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  });

  await logAuditEvent({
    actorUserId: actorUserId ?? pending.fromUserId,
    workspaceId,
    entityType: "WorkspaceOwnershipTransfer",
    entityId: cancelled.id,
    action: "transfer_cancelled",
    diff: { reason: "subscription_reactivated" },
  });
}

export async function acceptWorkspaceOwnershipTransfer(
  actor: User,
  token: string,
): Promise<{ workspaceSlug: string }> {
  const transfer = await findOwnershipTransferByToken(token);

  if (!transfer || transfer.status !== "PENDING_RECIPIENT") {
    throw new WorkspaceError("Transfer invitation not found or no longer valid.");
  }

  if (transfer.expiresAt.getTime() <= Date.now()) {
    await prisma.workspaceOwnershipTransfer.update({
      where: { id: transfer.id },
      data: { status: "EXPIRED" },
    });
    throw new WorkspaceError("This transfer invitation has expired.");
  }

  if (transfer.workspace.deletedAt) {
    throw new WorkspaceError("Workspace not found.");
  }

  if (normalizeTransferEmail(actor.email) !== transfer.toEmail) {
    throw new PermissionError("This transfer invitation was sent to a different email address.");
  }

  await assertTransferAcceptable(transfer.workspaceId);

  const workspaceId = transfer.workspaceId;
  const senderId = transfer.fromUserId;
  const recipientId = actor.id;

  await prisma.$transaction(async (tx) => {
    await tx.workspace.update({
      where: { id: workspaceId },
      data: { ownerId: recipientId },
    });

    await tx.workspaceMember.upsert({
      where: {
        workspaceId_userId: { workspaceId, userId: recipientId },
      },
      create: {
        workspaceId,
        userId: recipientId,
        role: "OWNER",
      },
      update: {
        role: "OWNER",
        deletedAt: null,
        state: "ACTIVE",
      },
    });

    if (transfer.keepSenderAsMember) {
      await tx.workspaceMember.upsert({
        where: {
          workspaceId_userId: { workspaceId, userId: senderId },
        },
        create: {
          workspaceId,
          userId: senderId,
          role: "MEMBER",
        },
        update: {
          role: "MEMBER",
          deletedAt: null,
          state: "ACTIVE",
        },
      });
    } else {
      await tx.workspaceMember.updateMany({
        where: { workspaceId, userId: senderId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    }

    await tx.workspaceOwnershipTransfer.update({
      where: { id: transfer.id },
      data: {
        status: "COMPLETED",
        acceptedAt: new Date(),
        toUserId: recipientId,
      },
    });
  });

  const billingAccount = await prisma.billingAccount.findFirst({
    where: { workspaceId },
    select: { payerUserId: true },
  });
  const payerUserId = billingAccount?.payerUserId ?? senderId;
  const billingHandoffStarted = payerUserId !== recipientId;

  await logAuditEvent({
    actorUserId: actor.id,
    workspaceId,
    entityType: "WorkspaceOwnershipTransfer",
    entityId: transfer.id,
    action: "transfer_accepted",
    diff: {
      fromUserId: senderId,
      toUserId: recipientId,
      billingHandoffStarted,
    },
  });

  if (billingHandoffStarted) {
    await logAuditEvent({
      actorUserId: actor.id,
      workspaceId,
      entityType: "BillingHandoff",
      entityId: workspaceId,
      action: "billing_handoff_started",
      diff: {
        payerUserId,
        ownerUserId: recipientId,
        billingOwnershipState: "HANDOFF_ACTIVE",
      },
    });
  }

  return { workspaceSlug: transfer.workspace.slug };
}

export async function declineWorkspaceOwnershipTransfer(
  actor: User,
  token: string,
): Promise<void> {
  const transfer = await findOwnershipTransferByToken(token);

  if (!transfer || transfer.status !== "PENDING_RECIPIENT") {
    throw new WorkspaceError("Transfer invitation not found or no longer valid.");
  }

  if (transfer.expiresAt.getTime() <= Date.now()) {
    await prisma.workspaceOwnershipTransfer.update({
      where: { id: transfer.id },
      data: { status: "EXPIRED" },
    });
    throw new WorkspaceError("This transfer invitation has expired.");
  }

  if (transfer.workspace.deletedAt) {
    throw new WorkspaceError("Workspace not found.");
  }

  if (normalizeTransferEmail(actor.email) !== transfer.toEmail) {
    throw new PermissionError("This transfer invitation was sent to a different email address.");
  }

  const declined = await prisma.workspaceOwnershipTransfer.update({
    where: { id: transfer.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  });

  await logAuditEvent({
    actorUserId: actor.id,
    workspaceId: transfer.workspaceId,
    entityType: "WorkspaceOwnershipTransfer",
    entityId: declined.id,
    action: "transfer_cancelled",
    diff: { reason: "declined_by_recipient" },
  });
}

export async function linkPendingTransfersToUser(userId: string, email: string): Promise<void> {
  const normalizedEmail = normalizeTransferEmail(email);

  await prisma.workspaceOwnershipTransfer.updateMany({
    where: {
      toEmail: normalizedEmail,
      status: "PENDING_RECIPIENT",
      toUserId: null,
    },
    data: { toUserId: userId },
  });
}

export async function hasPendingOutboundTransfer(userId: string): Promise<boolean> {
  await expireStalePendingTransfers();

  const count = await prisma.workspaceOwnershipTransfer.count({
    where: {
      fromUserId: userId,
      status: "PENDING_RECIPIENT",
      workspace: { deletedAt: null },
    },
  });

  return count > 0;
}
