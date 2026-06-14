import { getStripeClient } from "@/features/billing/server/stripe-client";

/**
 * Enforces one workspace = one active Stripe subscription by canceling duplicates.
 */
export async function enforceSingleActiveSubscription(params: {
  workspaceId: string;
  keepSubscriptionId: string;
  stripeCustomerId: string;
}): Promise<string[]> {
  const stripe = getStripeClient();
  const canceled: string[] = [];

  const { data: subscriptions } = await stripe.subscriptions.list({
    customer: params.stripeCustomerId,
    status: "all",
    limit: 100,
  });

  for (const subscription of subscriptions) {
    if (subscription.metadata.workspaceId !== params.workspaceId) {
      continue;
    }

    if (subscription.id === params.keepSubscriptionId) {
      continue;
    }

    if (subscription.status === "canceled" || subscription.status === "incomplete_expired") {
      continue;
    }

    await stripe.subscriptions.cancel(subscription.id);
    canceled.push(subscription.id);
    console.warn(
      `[billing] Canceled duplicate subscription ${subscription.id} for workspace ${params.workspaceId}`,
    );
  }

  return canceled;
}
