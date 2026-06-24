import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

import type Stripe from "stripe";



import { prisma } from "@/db/client";

import { getStripeClient } from "@/features/billing/server/stripe-client";

import { enforceSingleActiveSubscription } from "@/features/billing/server/subscription-invariants";

import {

  extractStripePriceId,

  resolvePlanFromStripeSubscription,

  isStripeSubscriptionScheduledToCancel,

} from "@/features/billing/server/stripe-plan-utils";

import { defaultPlanVersion } from "@/server/billing/plan-catalog";
import { recomputeIsActiveFree } from "@/server/billing/workspace-billing-maintenance";
import {
  suspendMembersOnWorkspaceExpired,
} from "@/server/billing/seat-overage";
import { syncWorkspaceEffectiveLimits } from "@/server/billing/workspace-plan-sync";
import {
  cancelAllWorkspaceAddons,
  syncWorkspaceAddonsFromStripe,
} from "@/features/billing/server/workspace-addon-sync";
import { findBasePlanSubscriptionItem } from "@/features/billing/server/stripe-plan-utils";



export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {

  switch (status) {

    case "active":

      return "ACTIVE";

    case "trialing":

      return "TRIAL";

    case "past_due":

    case "unpaid":

      return "PAST_DUE";

    case "paused":

      return "GRACE_PERIOD";

    case "canceled":

      return "CANCELED";

    default:

      return "INACTIVE";

  }

}



/**

 * Resolves the target workspace BillingAccount for a Stripe subscription. Workspace billing maps

 * one customer to many subscriptions/workspaces, so we resolve by `metadata.workspaceId` first and

 * fall back to the stored `stripeSubscriptionId`.

 */

async function resolveBillingAccountForSubscription(

  stripeSubscription: Stripe.Subscription,

): Promise<{ id: string; workspaceId: string | null } | null> {

  const workspaceId = stripeSubscription.metadata.workspaceId;



  if (workspaceId) {

    const workspace = await prisma.workspace.findUnique({

      where: { id: workspaceId },

      select: { billingAccount: { select: { id: true, workspaceId: true } } },

    });

    if (workspace?.billingAccount) {

      return workspace.billingAccount;

    }

  }



  const existing = await prisma.subscription.findUnique({

    where: { stripeSubscriptionId: stripeSubscription.id },

    select: { billingAccount: { select: { id: true, workspaceId: true } } },

  });



  return existing?.billingAccount ?? null;

}



export async function syncSubscriptionFromStripe(

  stripeSubscription: Stripe.Subscription,

  stripeCustomerId: string,

  options?: { planHint?: string | null },

) {

  const billingAccount = await resolveBillingAccountForSubscription(stripeSubscription);



  if (!billingAccount) {

    console.warn(

      `No workspace billing account for Stripe subscription ${stripeSubscription.id} (customer ${stripeCustomerId}).`,

    );

    return null;

  }



  const plan = resolvePlanFromStripeSubscription(stripeSubscription, {

    planHint: options?.planHint,

  });

  const status = mapStripeStatus(stripeSubscription.status);

  const baseItem = findBasePlanSubscriptionItem(stripeSubscription);
  const priceId = extractStripePriceId(baseItem);
  const periodEndTimestamp = baseItem?.current_period_end ?? null;

  const currentPeriodEnd = periodEndTimestamp ? new Date(periodEndTimestamp * 1000) : null;

  const cancelAtPeriodEnd = isStripeSubscriptionScheduledToCancel(stripeSubscription);

  const previousSubscription = await prisma.subscription.findUnique({
    where: { billingAccountId: billingAccount.id },
    select: { cancelAtPeriodEnd: true, status: true },
  });

  const previousCancelAtPeriodEnd = previousSubscription?.cancelAtPeriodEnd ?? false;

  let effectiveCancelAtPeriodEnd = cancelAtPeriodEnd;

  if (
    billingAccount.workspaceId &&
    previousCancelAtPeriodEnd &&
    !cancelAtPeriodEnd
  ) {
    const { enforceSubscriptionCancellationDuringHandoff } = await import(
      "@/features/billing/server/billing-handoff-subscription-guard"
    );
    const reverted = await enforceSubscriptionCancellationDuringHandoff(
      billingAccount.workspaceId,
      stripeSubscription,
    );
    if (reverted) {
      effectiveCancelAtPeriodEnd = true;
    }
  }

  if (billingAccount.workspaceId && (status === "ACTIVE" || status === "TRIAL")) {
    await enforceSingleActiveSubscription({
      workspaceId: billingAccount.workspaceId,
      keepSubscriptionId: stripeSubscription.id,
      stripeCustomerId,
    });
  }

  const subscription = await prisma.subscription.upsert({

    where: { billingAccountId: billingAccount.id },

    create: {

      billingAccountId: billingAccount.id,

      plan,

      planVersion: defaultPlanVersion(plan),

      status,

      stripeCustomerId,

      stripeSubscriptionId: stripeSubscription.id,

      stripePriceId: priceId,

      cancelAtPeriodEnd: effectiveCancelAtPeriodEnd,

      currentPeriodEnd,

    },

    update: {

      plan,

      planVersion: defaultPlanVersion(plan),

      status,

      stripeCustomerId,

      stripeSubscriptionId: stripeSubscription.id,

      stripePriceId: priceId,

      cancelAtPeriodEnd: effectiveCancelAtPeriodEnd,

      currentPeriodEnd,

      graceEndsAt: status === "ACTIVE" || status === "TRIAL" ? null : undefined,

    },

  });



  const { cancelActiveSubscriptionChanges, getActiveSubscriptionChange } = await import(
    "@/features/billing/server/subscription-change"
  );
  const activeChange = await getActiveSubscriptionChange(subscription.id);
  if (activeChange && plan === activeChange.targetPlan) {
    await cancelActiveSubscriptionChanges(subscription.id);
  }



  if (billingAccount.workspaceId && (status === "ACTIVE" || status === "TRIAL")) {

    await prisma.workspace.update({

      where: { id: billingAccount.workspaceId },

      data: { provisioningStatus: "ACTIVE" },

    });

  }



  if (billingAccount.workspaceId) {
    await recomputeIsActiveFree(billingAccount.workspaceId);
    await syncWorkspaceAddonsFromStripe({
      workspaceId: billingAccount.workspaceId,
      plan,
      stripeSubscription,
    });

    if (
      plan !== "FREE" &&
      (status === "ACTIVE" || status === "TRIAL") &&
      stripeSubscription.id
    ) {
      const accountOwner = await prisma.billingAccount.findUnique({
        where: { id: billingAccount.id },
        select: { ownerUserId: true },
      });
      if (accountOwner) {
        const { ensureReferralProfile } = await import(
          "@/features/referrals/server/user-referral-profile-service"
        );
        await ensureReferralProfile(accountOwner.ownerUserId);
      }

      const { tryActivateReferralFromSubscriptionSync } = await import(
        "@/features/referrals/server/referral-activation-service"
      );
      await tryActivateReferralFromSubscriptionSync({
        workspaceId: billingAccount.workspaceId,
        stripeSubscription,
        plan,
        status,
      });
    }

    if (previousCancelAtPeriodEnd && !effectiveCancelAtPeriodEnd) {
      const { cancelPendingTransferIfSubscriptionReactivated } = await import(
        "@/features/workspaces/server/ownership-transfer"
      );
      await cancelPendingTransferIfSubscriptionReactivated(
        billingAccount.workspaceId,
        effectiveCancelAtPeriodEnd,
      );
    }

    const { syncBillingStatusNotifications } = await import(
      "@/features/notifications/server/notification-billing-sync"
    );
    await syncBillingStatusNotifications({
      workspaceId: billingAccount.workspaceId,
      previousStatus: previousSubscription?.status ?? null,
      nextStatus: status,
    });
  }



  return subscription;

}



/**

 * Handles `customer.subscription.deleted`. NEVER downgrades the plan to FREE — instead winds the

 * workspace down through GRACE_PERIOD -> EXPIRED while keeping the plan, so reactivation restores it.

 */

export async function expireWorkspaceSubscription(stripeSubscriptionId: string) {

  const subscription = await prisma.subscription.findUnique({

    where: { stripeSubscriptionId },

    select: {
      id: true,
      billingAccount: {
        select: {
          id: true,
          workspaceId: true,
          payerUserId: true,
          handoffExpiredAt: true,
          workspace: { select: { ownerId: true } },
        },
      },
    },

  });



  if (!subscription) {

    return null;

  }



  const updated = await prisma.subscription.update({

    where: { id: subscription.id },

    data: {

      status: "EXPIRED",

      cancelAtPeriodEnd: false,

      stripeSubscriptionId: null,

    },

  });



  const billingAccount = subscription.billingAccount;
  if (billingAccount?.workspaceId && billingAccount.workspace) {
    const ownerId = billingAccount.workspace.ownerId;
    const payerUserId = billingAccount.payerUserId ?? ownerId;
    const handoffActive = payerUserId !== ownerId;

    if (handoffActive && !billingAccount.handoffExpiredAt) {
      await prisma.billingAccount.update({
        where: { id: billingAccount.id },
        data: { handoffExpiredAt: new Date() },
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: ownerId,
          workspaceId: billingAccount.workspaceId,
          entityType: "BillingHandoff",
          entityId: billingAccount.workspaceId,
          action: "billing_handoff_expired",
          diff: {
            payerUserId,
            ownerUserId: ownerId,
            billingOwnershipState: "HANDOFF_EXPIRED",
          },
        },
      });
    }

    await recomputeIsActiveFree(billingAccount.workspaceId);
    await cancelAllWorkspaceAddons(billingAccount.workspaceId);
    await suspendMembersOnWorkspaceExpired(billingAccount.workspaceId);

    const { syncBillingStatusNotifications } = await import(
      "@/features/notifications/server/notification-billing-sync"
    );
    await syncBillingStatusNotifications({
      workspaceId: billingAccount.workspaceId,
      previousStatus: null,
      nextStatus: "EXPIRED",
    });
  }



  return updated;

}



async function findNewestActiveSubscriptionForWorkspace(

  stripeCustomerId: string,

  workspaceId: string,

): Promise<Stripe.Subscription | null> {

  const stripe = getStripeClient();

  const { data: subscriptions } = await stripe.subscriptions.list({

    customer: stripeCustomerId,

    status: "all",

    limit: 100,

  });



  const matches = subscriptions.filter(

    (subscription) =>

      subscription.metadata.workspaceId === workspaceId &&

      (subscription.status === "active" || subscription.status === "trialing"),

  );



  if (matches.length === 0) {

    return null;

  }



  matches.sort((left, right) => right.created - left.created);

  return matches[0] ?? null;

}



/**

 * Syncs the workspace subscription from Stripe using the stored stripeSubscriptionId.

 * Used after returning from the billing portal (cancel/reactivate/payment method changes).

 */

export async function syncWorkspaceSubscriptionFromStripe(workspaceId: string) {

  const row = await prisma.subscription.findFirst({

    where: { billingAccount: { workspaceId } },

    select: { stripeSubscriptionId: true },

  });



  if (!row?.stripeSubscriptionId) {

    console.warn(

      `No Stripe subscription id in DB for workspace ${workspaceId}; skipping portal sync.`,

    );

    return null;

  }



  const stripe = getStripeClient();

  const subscription = await stripe.subscriptions.retrieve(row.stripeSubscriptionId);



  const stripeCustomerId =

    typeof subscription.customer === "string"

      ? subscription.customer

      : subscription.customer?.id;



  if (!stripeCustomerId) {

    console.warn(

      `Stripe subscription ${row.stripeSubscriptionId} has no customer; skipping portal sync.`,

    );

    return null;

  }



  return syncSubscriptionFromStripe(subscription, stripeCustomerId, {

    planHint: subscription.metadata.plan ?? null,

  });

}



/**

 * Pulls the workspace subscription from Stripe after checkout success. Used when the user lands

 * on checkout-success (localhost has no inbound webhook) and as a fallback if the webhook is

 * delayed.

 */

export async function syncWorkspaceSubscriptionAfterCheckout(workspaceId: string) {

  const { resolveBillingCustomer } = await import(

    "@/features/billing/server/billing-service"

  );

  const { stripeCustomerId } = await resolveBillingCustomer(workspaceId);



  const match = await findNewestActiveSubscriptionForWorkspace(stripeCustomerId, workspaceId);



  if (!match) {

    console.warn(

      `No active Stripe subscription found for workspace ${workspaceId} (customer ${stripeCustomerId}).`,

    );

    return null;

  }



  return syncSubscriptionFromStripe(match, stripeCustomerId, {

    planHint: match.metadata.plan ?? null,

  });

}



export async function handleCheckoutSessionCompleted(

  session: Stripe.Checkout.Session,

) {

  const workspaceId = session.metadata?.workspaceId;
  const metadataOwnerUserId = session.metadata?.ownerUserId;

  if (workspaceId && metadataOwnerUserId) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true },
    });
    if (!workspace || workspace.ownerId !== metadataOwnerUserId) {
      console.warn(
        `Checkout session owner mismatch for workspace ${workspaceId}; skipping sync.`,
      );
      return null;
    }
  }

  const stripeCustomerId =

    typeof session.customer === "string" ? session.customer : session.customer?.id;



  const stripeSubscriptionId =

    typeof session.subscription === "string"

      ? session.subscription

      : session.subscription?.id;



  if (!stripeCustomerId || !stripeSubscriptionId) {

    console.warn("Checkout session missing customer or subscription.");

    return null;

  }



  const stripe = getStripeClient();

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  const synced = await syncSubscriptionFromStripe(subscription, stripeCustomerId, {

    planHint: session.metadata?.plan ?? subscription.metadata.plan ?? null,

  });

  if (!workspaceId || !synced) {
    return synced;
  }

  const billingAccount = await prisma.billingAccount.findFirst({
    where: { workspaceId },
    select: {
      id: true,
      payerUserId: true,
      handoffExpiredAt: true,
      billingCustomerId: true,
      workspace: { select: { ownerId: true } },
    },
  });

  if (!billingAccount?.workspace) {
    return synced;
  }

  const ownerId = billingAccount.workspace.ownerId;
  const payerUserId = billingAccount.payerUserId ?? ownerId;
  const wasHandoffExpired =
    payerUserId !== ownerId && billingAccount.handoffExpiredAt !== null;

  if (wasHandoffExpired) {
    const billingCustomer = await prisma.billingCustomer.findFirst({
      where: { ownerUserId: ownerId, stripeCustomerId: { not: null } },
      orderBy: { createdAt: "desc" },
    });

    await prisma.$transaction(async (tx) => {
      await tx.billingAccount.update({
        where: { id: billingAccount.id },
        data: {
          payerUserId: ownerId,
          handoffExpiredAt: null,
          ...(billingCustomer ? { billingCustomerId: billingCustomer.id } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: ownerId,
          workspaceId,
          entityType: "BillingHandoff",
          entityId: workspaceId,
          action: "billing_handoff_completed",
          diff: {
            payerUserId: ownerId,
            previousPayerUserId: payerUserId,
            ownerUserId: ownerId,
            billingOwnershipState: "NORMAL",
          },
        },
      });
    });
  }

  return synced;

}



export async function recordStripeWebhookEvent(

  stripeEventId: string,

  type: string,

) {

  try {

    await prisma.stripeWebhookEvent.create({

      data: { stripeEventId, type },

    });

    return true;

  } catch {

    return false;

  }

}



export { resolvePlanFromStripeSubscription } from "@/features/billing/server/stripe-plan-utils";


