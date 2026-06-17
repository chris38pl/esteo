import "server-only";

import type { User, Workspace } from "@prisma/client";
import { cache } from "react";

import { prisma } from "@/db/client";
import {
  evaluateWorkspaceBillingPermissions,
  resolveEffectivePayerUserId,
  type WorkspaceBillingPermissions,
} from "@/features/billing/lib/billing-permissions-logic";
import { getWorkspaceMembership } from "@/server/permissions/require-workspace";
import { PermissionError } from "@/server/permissions/errors";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";

export type { WorkspaceBillingPermissions } from "@/features/billing/lib/billing-permissions-logic";

export type BillingPayerWorkspace = {
  id: string;
  name: string;
  slug: string;
};

type WorkspaceBillingContext = {
  workspaceId: string;
  ownerId: string;
  payerUserId: string;
};

const loadWorkspaceBillingContext = cache(
  async (workspaceId: string): Promise<WorkspaceBillingContext | null> => {
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, deletedAt: null },
      select: {
        id: true,
        ownerId: true,
        billingAccount: { select: { payerUserId: true } },
      },
    });

    if (!workspace) {
      return null;
    }

    return {
      workspaceId: workspace.id,
      ownerId: workspace.ownerId,
      payerUserId: resolveEffectivePayerUserId(
        workspace.billingAccount?.payerUserId,
        workspace.ownerId,
      ),
    };
  },
);

/** Single source of truth for payer checks — do not compare payerUserId inline elsewhere. */
export async function getWorkspaceBillingPayerId(workspaceId: string): Promise<string | null> {
  const context = await loadWorkspaceBillingContext(workspaceId);
  return context?.payerUserId ?? null;
}

export async function isWorkspaceBillingPayer(
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  const payerUserId = await getWorkspaceBillingPayerId(workspaceId);
  return payerUserId !== null && payerUserId === userId;
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
  });
}

export async function requireBillingPayer(user: User, workspaceId: string): Promise<void> {
  const isPayer = await isWorkspaceBillingPayer(user.id, workspaceId);
  if (!isPayer) {
    throw new PermissionError("Only the billing payer can manage this subscription.");
  }
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

/** Workspaces where the user is billing payer (may not be a member). */
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
      workspace: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { workspace: { name: "asc" } },
  });

  return accounts
    .map((account) => account.workspace)
    .filter((workspace): workspace is BillingPayerWorkspace => workspace !== null);
}

export async function getBillingPayerWorkspaceIdsForUser(userId: string): Promise<Set<string>> {
  const workspaces = await listWorkspacesWhereUserIsBillingPayer(userId);
  return new Set(workspaces.map((workspace) => workspace.id));
}
