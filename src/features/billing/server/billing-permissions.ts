import "server-only";

import type { SubscriptionPlan, SubscriptionStatus, User, Workspace } from "@prisma/client";
import { cache } from "react";

import { prisma } from "@/db/client";
import {
  deriveActiveBillingPayerId,
  deriveBillingOwnershipState,
  evaluateWorkspaceBillingPermissions,
  resolveEffectivePayerUserId,
  type BillingOwnershipState,
  type BillingPayerWorkspace,
  type WorkspaceBillingPermissions,
} from "@/features/billing/lib/billing-permissions-logic";
import { getWorkspaceMembership } from "@/server/permissions/require-workspace";
import { PermissionError } from "@/server/permissions/errors";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";

export type {
  BillingOwnershipState,
  WorkspaceBillingPermissions,
  BillingPayerWorkspace,
} from "@/features/billing/lib/billing-permissions-logic";

type WorkspaceBillingContext = {
  workspaceId: string;
  ownerId: string;
  payerUserId: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: SubscriptionPlan;
  handoffExpiredAt: Date | null;
  stripeSubscriptionId: string | null;
};

const DEFAULT_SUBSCRIPTION: Pick<
  WorkspaceBillingContext,
  "subscriptionStatus" | "subscriptionPlan" | "stripeSubscriptionId"
> = {
  subscriptionStatus: "ACTIVE",
  subscriptionPlan: "FREE",
  stripeSubscriptionId: null,
};

const loadWorkspaceBillingContext = cache(
  async (workspaceId: string): Promise<WorkspaceBillingContext | null> => {
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, deletedAt: null },
      select: {
        id: true,
        ownerId: true,
        billingAccount: {
          select: {
            payerUserId: true,
            handoffExpiredAt: true,
            subscription: {
              select: {
                status: true,
                plan: true,
                stripeSubscriptionId: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      return null;
    }

    const subscription = workspace.billingAccount?.subscription;

    return {
      workspaceId: workspace.id,
      ownerId: workspace.ownerId,
      payerUserId: resolveEffectivePayerUserId(
        workspace.billingAccount?.payerUserId,
        workspace.ownerId,
      ),
      subscriptionStatus: subscription?.status ?? DEFAULT_SUBSCRIPTION.subscriptionStatus,
      subscriptionPlan: subscription?.plan ?? DEFAULT_SUBSCRIPTION.subscriptionPlan,
      handoffExpiredAt: workspace.billingAccount?.handoffExpiredAt ?? null,
      stripeSubscriptionId: subscription?.stripeSubscriptionId ?? null,
    };
  },
);

export async function getWorkspaceBillingOwnershipState(
  workspaceId: string,
): Promise<BillingOwnershipState | null> {
  const context = await loadWorkspaceBillingContext(workspaceId);
  if (!context) {
    return null;
  }

  return deriveBillingOwnershipState({
    ownerUserId: context.ownerId,
    payerUserId: context.payerUserId,
    subscriptionStatus: context.subscriptionStatus,
    subscriptionPlan: context.subscriptionPlan,
    handoffExpiredAt: context.handoffExpiredAt,
    stripeSubscriptionId: context.stripeSubscriptionId,
  });
}

/** Single source of truth for active payer checks — use activeBillingPayerId, not raw payerUserId. */
export async function getWorkspaceActiveBillingPayerId(
  workspaceId: string,
): Promise<string | null> {
  const context = await loadWorkspaceBillingContext(workspaceId);
  if (!context) {
    return null;
  }

  const state = deriveBillingOwnershipState({
    ownerUserId: context.ownerId,
    payerUserId: context.payerUserId,
    subscriptionStatus: context.subscriptionStatus,
    subscriptionPlan: context.subscriptionPlan,
    handoffExpiredAt: context.handoffExpiredAt,
    stripeSubscriptionId: context.stripeSubscriptionId,
  });

  return deriveActiveBillingPayerId({
    billingOwnershipState: state,
    ownerUserId: context.ownerId,
    payerUserId: context.payerUserId,
  });
}

export async function isWorkspaceBillingPayer(
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  const permissions = await resolveWorkspaceBillingPermissions(userId, workspaceId);
  return permissions?.isBillingPayer ?? false;
}

export async function resolveWorkspaceBillingPermissions(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceBillingPermissions | null> {
  const context = await loadWorkspaceBillingContext(workspaceId);
  if (!context) {
    return null;
  }

  const membership = await getWorkspaceMembership(userId, workspaceId);
  const isActiveMember = membership?.state === "ACTIVE";

  return evaluateWorkspaceBillingPermissions({
    userId,
    workspaceOwnerId: context.ownerId,
    payerUserId: context.payerUserId,
    isActiveMember,
    subscriptionStatus: context.subscriptionStatus,
    subscriptionPlan: context.subscriptionPlan,
    handoffExpiredAt: context.handoffExpiredAt,
    stripeSubscriptionId: context.stripeSubscriptionId,
  });
}

async function requireWorkspaceBillingPermissions(
  user: User,
  workspaceId: string,
): Promise<WorkspaceBillingPermissions> {
  const permissions = await resolveWorkspaceBillingPermissions(user.id, workspaceId);
  if (!permissions) {
    throw new PermissionError("Workspace not found.");
  }
  return permissions;
}

export async function assertCanManageBilling(user: User, workspaceId: string): Promise<void> {
  const permissions = await requireWorkspaceBillingPermissions(user, workspaceId);
  if (!permissions.canManageBilling) {
    throw new PermissionError("You do not have permission to manage billing for this workspace.");
  }
}

export async function assertCanResumeSubscription(user: User, workspaceId: string): Promise<void> {
  const permissions = await requireWorkspaceBillingPermissions(user, workspaceId);
  if (!permissions.canResumeSubscription) {
    throw new PermissionError(
      "Subscription cannot be resumed while workspace ownership transfer is in progress.",
    );
  }
}

export async function assertCanChangePlanOrAddons(
  user: User,
  workspaceId: string,
): Promise<void> {
  const permissions = await requireWorkspaceBillingPermissions(user, workspaceId);
  if (!permissions.canChangePlanOrAddons) {
    throw new PermissionError("You do not have permission to change plans or add-ons for this workspace.");
  }
}

export async function assertCanPurchaseSubscription(
  user: User,
  workspaceId: string,
): Promise<void> {
  const permissions = await requireWorkspaceBillingPermissions(user, workspaceId);
  if (permissions.billingOwnershipState === "HANDOFF_EXPIRED") {
    if (user.id !== permissions.ownerId) {
      throw new PermissionError("Only the workspace owner may purchase a subscription.");
    }
    return;
  }
  if (!permissions.canPurchaseSubscription) {
    throw new PermissionError("You do not have permission to purchase a subscription for this workspace.");
  }
}

/** @deprecated Prefer assertCanManageBilling — kept for gradual migration. */
export async function requireBillingPayer(user: User, workspaceId: string): Promise<void> {
  await assertCanManageBilling(user, workspaceId);
}

export async function requireCanViewWorkspaceBilling(
  user: User,
  workspaceId: string,
): Promise<WorkspaceBillingPermissions> {
  const permissions = await resolveWorkspaceBillingPermissions(user.id, workspaceId);
  if (!permissions?.canViewBilling) {
    throw new PermissionError("You do not have access to billing for this workspace.");
  }
  return permissions;
}

export type ResolvedWorkspaceForBilling = {
  workspace: Workspace;
  canonicalSlug: string;
  matchedViaAlias: boolean;
  permissions: WorkspaceBillingPermissions;
};

export async function resolveWorkspaceForBilling(
  slug: string,
  userId: string,
): Promise<ResolvedWorkspaceForBilling | null> {
  const resolved = await resolveWorkspaceBySlug(slug, userId);
  if (resolved) {
    const permissions = await resolveWorkspaceBillingPermissions(userId, resolved.workspace.id);
    if (!permissions?.canViewBilling) {
      return null;
    }

    return {
      workspace: resolved.workspace,
      canonicalSlug: resolved.canonicalSlug,
      matchedViaAlias: resolved.matchedViaAlias,
      permissions,
    };
  }

  const workspace = await prisma.workspace.findFirst({
    where: { slug, deletedAt: null },
  });

  if (!workspace) {
    const alias = await prisma.workspaceSlugAlias.findUnique({
      where: { slug },
      include: { workspace: true },
    });

    if (!alias?.workspace || alias.workspace.deletedAt) {
      return null;
    }

    const permissions = await resolveWorkspaceBillingPermissions(userId, alias.workspace.id);
    if (!permissions?.canViewBilling) {
      return null;
    }

    return {
      workspace: alias.workspace,
      canonicalSlug: alias.workspace.slug,
      matchedViaAlias: true,
      permissions,
    };
  }

  const permissions = await resolveWorkspaceBillingPermissions(userId, workspace.id);
  if (!permissions?.canViewBilling) {
    return null;
  }

  return {
    workspace,
    canonicalSlug: workspace.slug,
    matchedViaAlias: false,
    permissions,
  };
}

/** Workspaces where the user is the active billing payer (may not be a member). */
export async function listWorkspacesWhereUserIsBillingPayer(
  userId: string,
): Promise<BillingPayerWorkspace[]> {
  const accounts = await prisma.billingAccount.findMany({
    where: {
      payerUserId: userId,
      workspaceId: { not: null },
      workspace: { deletedAt: null },
    },
    select: {
      workspaceId: true,
      workspace: { select: { id: true, name: true, slug: true, ownerId: true } },
      payerUserId: true,
      handoffExpiredAt: true,
      subscription: {
        select: {
          status: true,
          plan: true,
          stripeSubscriptionId: true,
        },
      },
    },
    orderBy: { workspace: { name: "asc" } },
  });

  return accounts
    .filter((account) => {
      if (!account.workspace || !account.workspaceId) {
        return false;
      }
      const state = deriveBillingOwnershipState({
        ownerUserId: account.workspace.ownerId,
        payerUserId: resolveEffectivePayerUserId(account.payerUserId, account.workspace.ownerId),
        subscriptionStatus: account.subscription?.status ?? "ACTIVE",
        subscriptionPlan: account.subscription?.plan ?? "FREE",
        handoffExpiredAt: account.handoffExpiredAt,
        stripeSubscriptionId: account.subscription?.stripeSubscriptionId ?? null,
      });
      return state === "HANDOFF_ACTIVE" && account.payerUserId === userId;
    })
    .map((account) => ({
      id: account.workspace!.id,
      name: account.workspace!.name,
      slug: account.workspace!.slug,
    }));
}

export async function getBillingPayerWorkspaceIdsForUser(userId: string): Promise<Set<string>> {
  const workspaces = await listWorkspacesWhereUserIsBillingPayer(userId);
  return new Set(workspaces.map((workspace) => workspace.id));
}
