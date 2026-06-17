import type { Prisma, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

import { prisma } from "@/db/client";
import {
  FREE_WORKSPACE_COOLDOWN_DAYS,
  FREE_WORKSPACE_MONTHLY_DELETE_LIMIT,
} from "@/features/workspaces/lib/free-workspace-policy";
import {
  assertCanCreateEstimateInWorkspace,
  assertCanUseAiAssistantInWorkspace,
  assertWorkspaceHasSeat,
  getFeatureState,
  getMaxUndoStepsForWorkspace,
} from "@/server/billing/entitlement-service";
import { recordUsage } from "@/server/billing/usage-service";
import { EntitlementError } from "@/server/permissions/errors";

/**
 * Legacy plan-entitlements shape. The authoritative limits now live in the versioned catalog
 * (`@/server/billing/plan-catalog`); this map is retained only for the few call sites that still
 * import `getEntitlements`/`PLAN_ENTITLEMENTS`.
 *
 * @deprecated Prefer `getWorkspaceEntitlements` / `resolvePlanLimits`.
 */
export type PlanEntitlements = {
  maxInvitedSeats: number | null;
  maxEstimatesPerMonth: number | null;
  maxAiAssistantCallsPerMonth: number | null;
  maxUndoSteps: number;
};

export const PLAN_ENTITLEMENTS: Record<SubscriptionPlan, PlanEntitlements> = {
  FREE: {
    maxInvitedSeats: 0,
    maxEstimatesPerMonth: 3,
    maxAiAssistantCallsPerMonth: 10,
    maxUndoSteps: 1,
  },
  PRO: {
    maxInvitedSeats: 0,
    maxEstimatesPerMonth: null,
    maxAiAssistantCallsPerMonth: 100,
    maxUndoSteps: 3,
  },
  BUSINESS: {
    maxInvitedSeats: 4,
    maxEstimatesPerMonth: null,
    maxAiAssistantCallsPerMonth: null,
    maxUndoSteps: 3,
  },
};

export function isPaidSubscriptionStatus(status: SubscriptionStatus): boolean {
  return status === "ACTIVE" || status === "TRIAL";
}

/** @deprecated Use `resolvePlanLimits` from the versioned catalog. */
export function getEntitlements(plan: SubscriptionPlan): PlanEntitlements {
  return PLAN_ENTITLEMENTS[plan];
}

export async function countOwnedWorkspaces(userId: string): Promise<number> {
  return prisma.workspace.count({
    where: { ownerId: userId, deletedAt: null },
  });
}

/** Rolling window + delete limit for free-workspace anti-farming policy. */
export {
  FREE_WORKSPACE_COOLDOWN_DAYS,
  FREE_WORKSPACE_MONTHLY_DELETE_LIMIT,
} from "@/features/workspaces/lib/free-workspace-policy";

/**
 * Counts FREE workspaces the owner soft-deleted within the rolling anti-farming window.
 * Creation is blocked once this reaches {@link FREE_WORKSPACE_MONTHLY_DELETE_LIMIT}.
 */
export async function countRecentDeletedFreeWorkspaces(
  ownerUserId: string,
  tx: Prisma.TransactionClient = prisma,
): Promise<number> {
  const cutoff = new Date(Date.now() - FREE_WORKSPACE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);

  return tx.workspace.count({
    where: {
      ownerId: ownerUserId,
      deletedAt: { gte: cutoff },
      billingAccount: { subscription: { plan: "FREE" } },
    },
  });
}

export async function countActiveFreeWorkspaces(ownerUserId: string): Promise<number> {
  return prisma.workspace.count({
    where: { ownerId: ownerUserId, deletedAt: null, isActiveFree: true },
  });
}

export async function countInvitedSeats(workspaceId: string): Promise<number> {
  return prisma.workspaceMember.count({
    where: {
      workspaceId,
      deletedAt: null,
      state: "ACTIVE",
      role: { not: "OWNER" },
    },
  });
}

/**
 * With workspace billing every user may own unlimited PAID workspaces and at most one ACTIVE FREE
 * workspace, so "can create a workspace at all" is always true. The FREE-specific rule is enforced
 * by {@link assertCanCreateFreeWorkspace} at creation time.
 */
export async function canUserCreateWorkspace(_userId: string): Promise<boolean> {
  return true;
}

/** @deprecated No longer gates creation; retained as a no-op for legacy call sites. */
export async function assertCanCreateWorkspace(_userId: string): Promise<void> {
  // Workspace creation is always permitted; plan selection + FREE rule handled at create time.
}

/**
 * Acquires a per-owner advisory lock (transaction scoped) so concurrent free-workspace creations
 * serialize. Pair with the partial unique index `Workspace(ownerId) WHERE isActiveFree` as the
 * hard backstop.
 */
export async function lockOwnerForWrite(
  tx: Prisma.TransactionClient,
  ownerUserId: string,
): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ownerUserId}))`;
}

/**
 * Enforces the "one active FREE workspace per owner" rule. Throws when a free slot is already taken.
 * Must be called inside a transaction holding {@link lockOwnerForWrite}; the partial unique index
 * still backstops races that slip past the app check.
 */
export async function assertCanCreateFreeWorkspace(
  ownerUserId: string,
  tx: Prisma.TransactionClient = prisma,
): Promise<void> {
  const existing = await tx.workspace.count({
    where: { ownerId: ownerUserId, deletedAt: null, isActiveFree: true },
  });

  if (existing > 0) {
    throw new EntitlementError(
      "You already have an active free workspace. Upgrade or remove it to create another.",
      "FREE_SLOT_ACTIVE",
    );
  }

  const recentlyDeleted = await countRecentDeletedFreeWorkspaces(ownerUserId, tx);
  if (recentlyDeleted >= FREE_WORKSPACE_MONTHLY_DELETE_LIMIT) {
    throw new EntitlementError(
      `You have reached the limit of ${FREE_WORKSPACE_MONTHLY_DELETE_LIMIT} free workspaces deleted in the last ${FREE_WORKSPACE_COOLDOWN_DAYS} days.`,
      "FREE_SLOT_COOLDOWN",
    );
  }
}

export async function canInviteWorkspaceMembers(workspaceId: string): Promise<boolean> {
  const state = await getFeatureState(workspaceId, "INVITES");
  return state !== "DISABLED";
}

export async function assertCanInviteMember(workspaceId: string): Promise<void> {
  await assertWorkspaceHasSeat(workspaceId);
}

// ---------------------------------------------------------------------------
// Workspace-scoped usage guards (delegate to the EntitlementService/UsageService).
// ---------------------------------------------------------------------------

export async function assertCanCreateEstimate(workspaceId: string): Promise<void> {
  await assertCanCreateEstimateInWorkspace(workspaceId);
}

export async function incrementEstimateUsage(
  workspaceId: string,
  userId?: string | null,
): Promise<void> {
  await recordUsage({ workspaceId, userId, meter: "ESTIMATE_CREATED" });
}

export async function assertCanUseAiAssistant(workspaceId: string): Promise<void> {
  await assertCanUseAiAssistantInWorkspace(workspaceId);
}

export async function incrementAiAssistantUsage(
  workspaceId: string,
  userId?: string | null,
): Promise<void> {
  await recordUsage({ workspaceId, userId, meter: "AI_ASSISTANT_CALL" });
}

export async function getMaxUndoSteps(workspaceId: string): Promise<number> {
  return getMaxUndoStepsForWorkspace(workspaceId);
}
