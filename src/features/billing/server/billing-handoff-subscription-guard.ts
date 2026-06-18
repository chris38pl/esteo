import "server-only";

import type Stripe from "stripe";

import { prisma } from "@/db/client";
import {
  deriveBillingOwnershipState,
  resolveEffectivePayerUserId,
} from "@/features/billing/lib/billing-permissions-logic";
import { getStripeClient } from "@/features/billing/server/stripe-client";
import { isStripeSubscriptionScheduledToCancel } from "@/features/billing/server/stripe-plan-utils";

/**
 * During HANDOFF_ACTIVE the subscription must remain scheduled to cancel.
 * Re-applies cancellation on Stripe if the payer resumed via portal or another path.
 */
export async function enforceSubscriptionCancellationDuringHandoff(
  workspaceId: string,
  stripeSubscription: Stripe.Subscription,
): Promise<boolean> {
  if (isStripeSubscriptionScheduledToCancel(stripeSubscription)) {
    return false;
  }

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
    select: {
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

  const billingAccount = workspace?.billingAccount;
  const subscription = billingAccount?.subscription;

  if (!workspace || !billingAccount || !subscription?.stripeSubscriptionId) {
    return false;
  }

  const billingOwnershipState = deriveBillingOwnershipState({
    ownerUserId: workspace.ownerId,
    payerUserId: resolveEffectivePayerUserId(billingAccount.payerUserId, workspace.ownerId),
    subscriptionStatus: subscription.status,
    subscriptionPlan: subscription.plan,
    handoffExpiredAt: billingAccount.handoffExpiredAt,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
  });

  if (billingOwnershipState !== "HANDOFF_ACTIVE") {
    return false;
  }

  const stripe = getStripeClient();

  if (stripeSubscription.cancel_at != null) {
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, { cancel_at: "" });
  }

  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  console.warn(
    JSON.stringify({
      event: "billing_handoff_resume_blocked",
      workspaceId,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
    }),
  );

  return true;
}
