import type { BillingAccount, Prisma, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

import { prisma } from "@/db/client";
import { defaultPlanVersion } from "@/server/billing/plan-catalog";

type Tx = Prisma.TransactionClient;

/**
 * Creates a workspace-owned BillingAccount (1:1) + Subscription inside a transaction.
 * Used by `createWorkspace`; the BillingAccount is linked to the workspace and a Subscription
 * is provisioned with the requested plan/version.
 */
export async function provisionWorkspaceBilling(
  tx: Tx,
  input: {
    workspaceId: string;
    ownerUserId: string;
    payerUserId?: string;
    plan?: SubscriptionPlan;
    status?: SubscriptionStatus;
    billingCustomerId?: string | null;
  },
): Promise<BillingAccount> {
  const plan = input.plan ?? "FREE";
  const status: SubscriptionStatus = input.status ?? "ACTIVE";

  return tx.billingAccount.update({
    where: { workspaceId: input.workspaceId },
    data: {
      ownerUserId: input.ownerUserId,
      payerUserId: input.payerUserId ?? input.ownerUserId,
      billingCustomerId: input.billingCustomerId ?? undefined,
      subscription: {
        create: {
          plan,
          planVersion: defaultPlanVersion(plan),
          status,
        },
      },
    },
  });
}

/**
 * Ensures a workspace has its own 1:1 BillingAccount. If the workspace still points at a legacy
 * shared account (pre-backfill), a dedicated account + grandfathered Subscription is created and
 * the workspace repointed. Idempotent.
 */
export async function ensureWorkspaceBillingAccount(
  workspaceId: string,
): Promise<BillingAccount> {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: {
      id: true,
      ownerId: true,
      billingAccountId: true,
      ownBillingAccount: { select: { id: true } },
      billingAccount: {
        select: {
          id: true,
          workspaceId: true,
          payerUserId: true,
          billingCustomerId: true,
          subscription: { select: { plan: true, planVersion: true, status: true } },
        },
      },
    },
  });

  // Already 1:1 with this workspace.
  if (workspace.ownBillingAccount) {
    return prisma.billingAccount.findUniqueOrThrow({ where: { workspaceId } });
  }

  const legacy = workspace.billingAccount;
  const plan = legacy?.subscription?.plan ?? "FREE";
  const status = legacy?.subscription?.status ?? "ACTIVE";

  return prisma.$transaction(async (tx) => {
    const account = await tx.billingAccount.create({
      data: {
        ownerUserId: workspace.ownerId,
        payerUserId: legacy?.payerUserId ?? workspace.ownerId,
        workspaceId: workspace.id,
        billingCustomerId: legacy?.billingCustomerId ?? undefined,
        subscription: {
          create: {
            plan,
            planVersion: legacy?.subscription?.planVersion ?? defaultPlanVersion(plan),
            status,
          },
        },
      },
    });

    await tx.workspace.update({
      where: { id: workspace.id },
      data: { billingAccountId: account.id },
    });

    return account;
  });
}

export async function getWorkspaceSubscription(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { billingAccount: { select: { subscription: true } } },
  });

  return workspace?.billingAccount?.subscription ?? null;
}
