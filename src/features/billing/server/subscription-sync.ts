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

  reconcileSeatsAfterPlanChange,

  suspendMembersOnWorkspaceExpired,

} from "@/server/billing/seat-overage";

import { syncWorkspaceStorageLimitFromPlan } from "@/server/billing/workspace-plan-sync";



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

  const priceId = extractStripePriceId(stripeSubscription.items.data[0]);

  const periodEndTimestamp = stripeSubscription.items.data[0]?.current_period_end ?? null;

  const currentPeriodEnd = periodEndTimestamp ? new Date(periodEndTimestamp * 1000) : null;

  const cancelAtPeriodEnd = isStripeSubscriptionScheduledToCancel(stripeSubscription);



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

      cancelAtPeriodEnd,

      currentPeriodEnd,

    },

    update: {

      plan,

      planVersion: defaultPlanVersion(plan),

      status,

      stripeCustomerId,

      stripeSubscriptionId: stripeSubscription.id,

      stripePriceId: priceId,

      cancelAtPeriodEnd,

      currentPeriodEnd,

      graceEndsAt: status === "ACTIVE" || status === "TRIAL" ? null : undefined,

    },

  });



  if (billingAccount.workspaceId && (status === "ACTIVE" || status === "TRIAL")) {

    await prisma.workspace.update({

      where: { id: billingAccount.workspaceId },

      data: { provisioningStatus: "ACTIVE" },

    });

  }



  if (billingAccount.workspaceId) {

    await recomputeIsActiveFree(billingAccount.workspaceId);

    await syncWorkspaceStorageLimitFromPlan(billingAccount.workspaceId);

    await reconcileSeatsAfterPlanChange(billingAccount.workspaceId);

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

    select: { id: true, billingAccount: { select: { workspaceId: true } } },

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



  if (subscription.billingAccount?.workspaceId) {

    await recomputeIsActiveFree(subscription.billingAccount.workspaceId);

    await suspendMembersOnWorkspaceExpired(subscription.billingAccount.workspaceId);

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

  return syncSubscriptionFromStripe(subscription, stripeCustomerId, {

    planHint: session.metadata?.plan ?? subscription.metadata.plan ?? null,

  });

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


