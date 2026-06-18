import "server-only";

import { prisma } from "@/db/client";
import {
  deriveBillingOwnershipState,
  isHandoffTimedOut,
  resolveEffectivePayerUserId,
} from "@/features/billing/lib/billing-permissions-logic";
import { defaultPlanVersion } from "@/server/billing/plan-catalog";
import { recomputeIsActiveFree } from "@/server/billing/workspace-billing-maintenance";

/**
 * Lazy 90-day billing handoff cleanup. Call from dashboard layout, billing pages, transfer eligibility.
 * Audit event MUST be written before clearing handoffExpiredAt.
 */
export async function resolveStaleBillingHandoff(workspaceId: string): Promise<boolean> {
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
    select: {
      id: true,
      ownerId: true,
      billingAccount: {
        select: {
          id: true,
          payerUserId: true,
          handoffExpiredAt: true,
          subscription: {
            select: {
              id: true,
              status: true,
              plan: true,
              stripeSubscriptionId: true,
            },
          },
        },
      },
    },
  });

  const billingAccount = workspace?.billingAccount;
  const subscription = billingAccount?.subscription;
  if (!workspace || !billingAccount || !subscription) {
    return false;
  }

  const payerUserId = resolveEffectivePayerUserId(
    billingAccount.payerUserId,
    workspace.ownerId,
  );

  const state = deriveBillingOwnershipState({
    ownerUserId: workspace.ownerId,
    payerUserId,
    subscriptionStatus: subscription.status,
    subscriptionPlan: subscription.plan,
    handoffExpiredAt: billingAccount.handoffExpiredAt,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
  });

  if (state !== "HANDOFF_EXPIRED" || !isHandoffTimedOut(billingAccount.handoffExpiredAt)) {
    return false;
  }

  const handoffExpiredAtSnapshot = billingAccount.handoffExpiredAt;
  const payerUserIdSnapshot = payerUserId;

  await prisma.$transaction(async (tx) => {
    await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: "FREE",
        planVersion: defaultPlanVersion("FREE"),
        status: "ACTIVE",
        stripeSubscriptionId: null,
        stripePriceId: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        graceEndsAt: null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: workspace.ownerId,
        workspaceId: workspace.id,
        entityType: "BillingHandoff",
        entityId: workspace.id,
        action: "billing_handoff_timed_out",
        diff: {
          billingOwnershipState: "NORMAL",
          payerUserId: payerUserIdSnapshot,
          handoffExpiredAt: handoffExpiredAtSnapshot?.toISOString() ?? null,
          ownerUserId: workspace.ownerId,
        },
      },
    });

    await tx.billingAccount.update({
      where: { id: billingAccount.id },
      data: { handoffExpiredAt: null },
    });
  });

  await recomputeIsActiveFree(workspaceId);
  return true;
}
