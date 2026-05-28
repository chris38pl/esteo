import type Stripe from "stripe";

import {
  downgradeSubscriptionToFree,
  handleCheckoutSessionCompleted,
  recordStripeWebhookEvent,
  syncSubscriptionFromStripe,
} from "@/features/billing/server/subscription-sync";
import { getStripeClient } from "@/features/billing/server/stripe-client";

export async function processStripeWebhookEvent(event: Stripe.Event) {
  const isNew = await recordStripeWebhookEvent(event.id, event.type);

  if (!isNew) {
    return { duplicate: true as const };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;
      await syncSubscriptionFromStripe(subscription, customerId);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;
      await downgradeSubscriptionToFree(customerId);
      break;
    }
    default:
      break;
  }

  return { duplicate: false as const };
}

export async function constructStripeEvent(
  payload: string,
  signature: string,
): Promise<Stripe.Event> {
  const stripe = getStripeClient();
  const { getStripeWebhookSecret } = await import(
    "@/features/billing/server/stripe-client"
  );

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    getStripeWebhookSecret(),
  );
}
