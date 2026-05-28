import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";

import { prisma } from "@/db/client";
import { getStripeClient } from "@/features/billing/server/stripe-client";

const STRIPE_PRICE_TO_PLAN: Record<string, SubscriptionPlan> = {};

function loadPricePlanMap() {
  if (process.env.STRIPE_PRICE_PRO) {
    STRIPE_PRICE_TO_PLAN[process.env.STRIPE_PRICE_PRO] = "PRO";
  }

  if (process.env.STRIPE_PRICE_BUSINESS) {
    STRIPE_PRICE_TO_PLAN[process.env.STRIPE_PRICE_BUSINESS] = "BUSINESS";
  }
}

export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIAL";
    case "canceled":
      return "CANCELED";
    default:
      return "INACTIVE";
  }
}

export function resolvePlanFromStripeSubscription(
  subscription: Stripe.Subscription,
): SubscriptionPlan {
  loadPricePlanMap();

  const priceId = subscription.items.data[0]?.price.id;

  if (priceId && STRIPE_PRICE_TO_PLAN[priceId]) {
    return STRIPE_PRICE_TO_PLAN[priceId];
  }

  const metadataPlan = subscription.metadata.plan?.toUpperCase();

  if (metadataPlan === "PRO" || metadataPlan === "BUSINESS") {
    return metadataPlan;
  }

  return "PRO";
}

export async function syncSubscriptionFromStripe(
  stripeSubscription: Stripe.Subscription,
  stripeCustomerId: string,
) {
  const billingAccount = await prisma.billingAccount.findFirst({
    where: { stripeCustomerId },
    include: { subscription: true },
  });

  if (!billingAccount) {
    console.warn(`No billing account for Stripe customer ${stripeCustomerId}`);
    return null;
  }

  const plan = resolvePlanFromStripeSubscription(stripeSubscription);
  const status = mapStripeStatus(stripeSubscription.status);
  const periodEndTimestamp =
    stripeSubscription.items.data[0]?.current_period_end ?? null;
  const currentPeriodEnd = periodEndTimestamp
    ? new Date(periodEndTimestamp * 1000)
    : null;

  return prisma.subscription.upsert({
    where: { billingAccountId: billingAccount.id },
    create: {
      billingAccountId: billingAccount.id,
      plan,
      status,
      stripeCustomerId,
      stripeSubscriptionId: stripeSubscription.id,
      currentPeriodEnd,
    },
    update: {
      plan,
      status,
      stripeCustomerId,
      stripeSubscriptionId: stripeSubscription.id,
      currentPeriodEnd,
    },
  });
}

export async function downgradeSubscriptionToFree(stripeCustomerId: string) {
  const billingAccount = await prisma.billingAccount.findFirst({
    where: { stripeCustomerId },
  });

  if (!billingAccount) {
    return null;
  }

  return prisma.subscription.update({
    where: { billingAccountId: billingAccount.id },
    data: {
      plan: "FREE",
      status: "CANCELED",
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
    },
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

  let billingAccount = await prisma.billingAccount.findFirst({
    where: { stripeCustomerId },
  });

  if (!billingAccount) {
    const customerEmail = session.customer_details?.email ?? session.customer_email;

    if (!customerEmail) {
      console.warn("Cannot link checkout session without customer email.");
      return null;
    }

    const user = await prisma.user.findUnique({ where: { email: customerEmail } });

    if (!user) {
      console.warn(`No user found for checkout email ${customerEmail}`);
      return null;
    }

    billingAccount = await prisma.billingAccount.update({
      where: { ownerUserId: user.id },
      data: { stripeCustomerId },
    });
  }

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  return syncSubscriptionFromStripe(subscription, stripeCustomerId);
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
