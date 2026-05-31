import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

import { prisma } from "@/db/client";
import { countAccessibleWorkspaces } from "@/features/workspaces/server/accessible-workspaces";
import { EntitlementError } from "@/server/permissions/errors";

export type PlanEntitlements = {
  maxOwnedWorkspaces: number | null;
  maxInvitedSeats: number | null;
  maxAccessibleWorkspaces: number | null;
  maxEstimatesPerMonth: number | null;
};

export const PLAN_ENTITLEMENTS: Record<SubscriptionPlan, PlanEntitlements> = {
  FREE: {
    maxOwnedWorkspaces: 1,
    maxInvitedSeats: 0,
    maxAccessibleWorkspaces: 1,
    maxEstimatesPerMonth: 3,
  },
  PRO: {
    maxOwnedWorkspaces: 1,
    maxInvitedSeats: 3,
    maxAccessibleWorkspaces: 3,
    maxEstimatesPerMonth: null,
  },
  BUSINESS: {
    maxOwnedWorkspaces: null,
    maxInvitedSeats: null,
    maxAccessibleWorkspaces: null,
    maxEstimatesPerMonth: null,
  },
};

export function isPaidSubscriptionStatus(status: SubscriptionStatus): boolean {
  return status === "ACTIVE" || status === "TRIAL";
}

export function getEntitlements(plan: SubscriptionPlan): PlanEntitlements {
  return PLAN_ENTITLEMENTS[plan];
}

function currentPeriodKey(): string {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}-${month}`;
}

export async function countOwnedWorkspaces(userId: string): Promise<number> {
  return prisma.workspace.count({
    where: { ownerId: userId, deletedAt: null },
  });
}

export async function countInvitedSeats(workspaceId: string): Promise<number> {
  return prisma.workspaceMember.count({
    where: {
      workspaceId,
      deletedAt: null,
      role: { not: "OWNER" },
    },
  });
}

export async function canUserCreateWorkspace(userId: string): Promise<boolean> {
  try {
    await assertCanCreateWorkspace(userId);
    return true;
  } catch (error) {
    if (error instanceof EntitlementError) {
      return false;
    }
    throw error;
  }
}

export async function assertCanCreateWorkspace(userId: string): Promise<void> {
  const subscription = await prisma.subscription.findFirst({
    where: { billingAccount: { ownerUserId: userId } },
  });

  const plan = subscription?.plan ?? "FREE";
  const entitlements = getEntitlements(plan);
  const owned = await countOwnedWorkspaces(userId);

  if (
    entitlements.maxOwnedWorkspaces !== null &&
    owned >= entitlements.maxOwnedWorkspaces
  ) {
    throw new EntitlementError("Workspace limit reached for your plan.");
  }
}

export async function canInviteWorkspaceMembers(workspaceId: string): Promise<boolean> {
  // Workspace.billingAccount is the owner's account (set at create) — seat limits only, not member UI.
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
    include: {
      billingAccount: { include: { subscription: true } },
    },
  });

  if (!workspace?.billingAccount.subscription) {
    return true;
  }

  const entitlements = getEntitlements(workspace.billingAccount.subscription.plan);
  return entitlements.maxInvitedSeats !== 0;
}

export async function assertCanInviteMember(workspaceId: string): Promise<void> {
  // Uses the workspace owner's subscription (Workspace.billingAccountId), not the current user's.
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
    include: {
      billingAccount: { include: { subscription: true } },
    },
  });

  if (!workspace?.billingAccount.subscription) {
    return;
  }

  const { plan } = workspace.billingAccount.subscription;
  const entitlements = getEntitlements(plan);

  if (entitlements.maxInvitedSeats === null) {
    return;
  }

  const invitedSeats = await countInvitedSeats(workspaceId);

  if (invitedSeats >= entitlements.maxInvitedSeats) {
    throw new EntitlementError(
      "Member limit reached for this workspace.",
      "WORKSPACE_SEAT_LIMIT",
    );
  }
}

export async function assertCanAcceptInvitation(userId: string): Promise<void> {
  const subscription = await prisma.subscription.findFirst({
    where: { billingAccount: { ownerUserId: userId } },
  });

  const plan = subscription?.plan ?? "FREE";
  const entitlements = getEntitlements(plan);

  if (entitlements.maxAccessibleWorkspaces === null) {
    return;
  }

  const accessible = await countAccessibleWorkspaces(userId);

  if (accessible >= entitlements.maxAccessibleWorkspaces) {
    throw new EntitlementError(
      "Workspace access limit reached for your plan.",
      "INVITEE_PLAN_LIMIT",
    );
  }
}

export async function assertCanCreateEstimate(userId: string): Promise<void> {
  const billingAccount = await prisma.billingAccount.findUnique({
    where: { ownerUserId: userId },
    include: { subscription: true },
  });

  if (!billingAccount?.subscription) {
    return;
  }

  const entitlements = getEntitlements(billingAccount.subscription.plan);

  if (entitlements.maxEstimatesPerMonth === null) {
    return;
  }

  const periodKey = currentPeriodKey();
  const usage = await prisma.billingAccountUsagePeriod.findUnique({
    where: {
      billingAccountId_periodKey: {
        billingAccountId: billingAccount.id,
        periodKey,
      },
    },
  });

  const estimatesCreated = usage?.estimatesCreated ?? 0;

  if (estimatesCreated >= entitlements.maxEstimatesPerMonth) {
    throw new EntitlementError("Monthly estimate limit reached for your plan.");
  }
}

export async function incrementEstimateUsage(userId: string): Promise<void> {
  const billingAccount = await prisma.billingAccount.findUnique({
    where: { ownerUserId: userId },
  });

  if (!billingAccount) {
    return;
  }

  const periodKey = currentPeriodKey();

  await prisma.billingAccountUsagePeriod.upsert({
    where: {
      billingAccountId_periodKey: {
        billingAccountId: billingAccount.id,
        periodKey,
      },
    },
    create: {
      billingAccountId: billingAccount.id,
      periodKey,
      estimatesCreated: 1,
    },
    update: {
      estimatesCreated: { increment: 1 },
    },
  });
}

export async function incrementAiAssistantUsage(userId: string): Promise<void> {
  const billingAccount = await prisma.billingAccount.findUnique({
    where: { ownerUserId: userId },
  });

  if (!billingAccount) {
    return;
  }

  const periodKey = currentPeriodKey();

  await prisma.billingAccountUsagePeriod.upsert({
    where: {
      billingAccountId_periodKey: {
        billingAccountId: billingAccount.id,
        periodKey,
      },
    },
    create: {
      billingAccountId: billingAccount.id,
      periodKey,
      aiAssistantCalls: 1,
    },
    update: {
      aiAssistantCalls: { increment: 1 },
    },
  });
}
