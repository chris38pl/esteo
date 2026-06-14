import { prisma } from "@/db/client";
import { getSeatUsage } from "@/server/billing/entitlement-service";
import { resolvePlanLimits } from "@/server/billing/plan-catalog";

type SeatLimitContext = {
  seatLimit: number | null;
  used: number;
  reserved: number;
};

async function loadSeatLimitContext(workspaceId: string): Promise<SeatLimitContext | null> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId, deletedAt: null },
    select: {
      billingAccount: {
        select: { subscription: { select: { plan: true, planVersion: true } } },
      },
    },
  });

  if (!workspace) {
    return null;
  }

  const sub = workspace.billingAccount?.subscription;
  const limits = resolvePlanLimits(sub?.plan ?? "FREE", sub?.planVersion ?? null);
  const seats = await getSeatUsage(workspaceId);

  return {
    seatLimit: limits.maxInvitedSeats,
    used: seats.used,
    reserved: seats.reserved,
  };
}

/**
 * After a plan downgrade or cancellation, suspend the most-recently-added non-owner members (LIFO)
 * until the workspace is within its seat limit. Excess pending invitations move to ON_HOLD.
 */
export async function reconcileSeatsAfterPlanChange(workspaceId: string): Promise<void> {
  const ctx = await loadSeatLimitContext(workspaceId);
  if (!ctx || ctx.seatLimit === null) {
    return;
  }

  const occupied = ctx.used + ctx.reserved;
  if (occupied <= ctx.seatLimit) {
    await reactivateSuspendedMembersWithinLimit(workspaceId, ctx.seatLimit);
    return;
  }

  const overBy = occupied - ctx.seatLimit;

  const activeMembers = await prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      state: "ACTIVE",
      role: { not: "OWNER" },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  const toSuspend = activeMembers.slice(0, Math.min(overBy, activeMembers.length));
  if (toSuspend.length > 0) {
    await prisma.workspaceMember.updateMany({
      where: { id: { in: toSuspend.map((m) => m.id) } },
      data: { state: "SUSPENDED", suspendedReason: "SEAT_OVERAGE" },
    });
  }

  await holdExcessPendingInvitations(workspaceId, ctx.seatLimit);
}

/** Reactivates suspended members (oldest first) when seats become available after upgrade. */
export async function reactivateSuspendedMembersWithinLimit(
  workspaceId: string,
  seatLimit: number,
): Promise<void> {
  const activeNonOwner = await prisma.workspaceMember.count({
    where: {
      workspaceId,
      deletedAt: null,
      state: "ACTIVE",
      role: { not: "OWNER" },
    },
  });

  const pendingInvites = await prisma.workspaceInvitation.count({
    where: { workspaceId, status: "PENDING" },
  });

  const slotsLeft = Math.max(0, seatLimit - activeNonOwner - pendingInvites);
  if (slotsLeft === 0) {
    return;
  }

  const suspended = await prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      state: "SUSPENDED",
      suspendedReason: "SEAT_OVERAGE",
      role: { not: "OWNER" },
    },
    orderBy: { createdAt: "asc" },
    take: slotsLeft,
    select: { id: true },
  });

  if (suspended.length > 0) {
    await prisma.workspaceMember.updateMany({
      where: { id: { in: suspended.map((m) => m.id) } },
      data: { state: "ACTIVE", suspendedReason: null },
    });
  }

  await releaseOnHoldInvitationsWithinLimit(workspaceId, seatLimit);
}

async function holdExcessPendingInvitations(
  workspaceId: string,
  seatLimit: number,
): Promise<void> {
  const activeNonOwner = await prisma.workspaceMember.count({
    where: {
      workspaceId,
      deletedAt: null,
      state: "ACTIVE",
      role: { not: "OWNER" },
    },
  });

  const slotsForInvites = Math.max(0, seatLimit - activeNonOwner);
  const pending = await prisma.workspaceInvitation.findMany({
    where: { workspaceId, status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  const toHold = pending.slice(slotsForInvites);
  if (toHold.length === 0) {
    return;
  }

  await prisma.workspaceInvitation.updateMany({
    where: { id: { in: toHold.map((i) => i.id) } },
    data: { status: "ON_HOLD" },
  });
}

async function releaseOnHoldInvitationsWithinLimit(
  workspaceId: string,
  seatLimit: number,
): Promise<void> {
  const activeNonOwner = await prisma.workspaceMember.count({
    where: {
      workspaceId,
      deletedAt: null,
      state: "ACTIVE",
      role: { not: "OWNER" },
    },
  });

  const pending = await prisma.workspaceInvitation.count({
    where: { workspaceId, status: "PENDING" },
  });

  const slotsLeft = Math.max(0, seatLimit - activeNonOwner - pending);
  if (slotsLeft === 0) {
    return;
  }

  const onHold = await prisma.workspaceInvitation.findMany({
    where: { workspaceId, status: "ON_HOLD" },
    orderBy: { createdAt: "asc" },
    take: slotsLeft,
    select: { id: true },
  });

  if (onHold.length > 0) {
    await prisma.workspaceInvitation.updateMany({
      where: { id: { in: onHold.map((i) => i.id) } },
      data: { status: "PENDING" },
    });
  }
}

/** When a workspace expires, suspend all non-owner members (data retained). */
export async function suspendMembersOnWorkspaceExpired(workspaceId: string): Promise<void> {
  await prisma.workspaceMember.updateMany({
    where: {
      workspaceId,
      deletedAt: null,
      state: "ACTIVE",
      role: { not: "OWNER" },
    },
    data: { state: "SUSPENDED", suspendedReason: "UNPAID" },
  });

  await prisma.workspaceInvitation.updateMany({
    where: { workspaceId, status: { in: ["PENDING", "ON_HOLD"] } },
    data: { status: "ON_HOLD" },
  });
}

export function isSeatOverLimit(ctx: SeatLimitContext): boolean {
  if (ctx.seatLimit === null) {
    return false;
  }
  return ctx.used + ctx.reserved > ctx.seatLimit;
}

export async function getSeatOverageState(workspaceId: string): Promise<{
  isOverLimit: boolean;
  seatLimit: number | null;
  used: number;
  reserved: number;
}> {
  const ctx = await loadSeatLimitContext(workspaceId);
  if (!ctx) {
    return { isOverLimit: false, seatLimit: null, used: 0, reserved: 0 };
  }

  return {
    isOverLimit: isSeatOverLimit(ctx),
    seatLimit: ctx.seatLimit,
    used: ctx.used,
    reserved: ctx.reserved,
  };
}
