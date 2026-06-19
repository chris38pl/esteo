import type Stripe from "stripe";

import {
  expireWorkspaceSubscription,
  handleCheckoutSessionCompleted,
  recordStripeWebhookEvent,
  syncSubscriptionFromStripe,
} from "@/features/billing/server/subscription-sync";
import { getStripeClient } from "@/features/billing/server/stripe-client";
import {
  handleReferralActivationFromInvoice,
  handleReferralSubscriptionUpdated,
  resolveWorkspaceIdFromStripeSubscription,
} from "@/features/referrals/server/referral-activation-service";

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
      const workspaceId = await resolveWorkspaceIdFromStripeSubscription(subscription);
      if (workspaceId) {
        await handleReferralSubscriptionUpdated(workspaceId);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const workspaceId = await resolveWorkspaceIdFromStripeSubscription(subscription);
      if (workspaceId) {
        await handleReferralSubscriptionUpdated(workspaceId);
      }
      // Wind down to EXPIRED but keep the plan (no auto-downgrade to FREE).
      await expireWorkspaceSubscription(subscription.id);
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null;
      };
      const subscriptionRef = invoice.subscription;
      const subscriptionId =
        typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;

      if (!subscriptionId) {
        break;
      }

      const stripe = getStripeClient();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const workspaceId = await resolveWorkspaceIdFromStripeSubscription(subscription);
      if (workspaceId) {
        await handleReferralActivationFromInvoice({
          invoice,
          subscription,
          workspaceId,
        });
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null;
      };
      const subscriptionRef = invoice.subscription;
      const subscriptionId =
        typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;

      if (!subscriptionId) {
        break;
      }

      const stripe = getStripeClient();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;
      await syncSubscriptionFromStripe(
        { ...subscription, status: "past_due" },
        customerId,
      );
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
