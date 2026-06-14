import { randomUUID } from "node:crypto";

import type Stripe from "stripe";

import { processStripeWebhookEvent } from "@/features/billing/server/webhooks";
import { assertDevBillingCliEnabled } from "@/server/billing/dev-toolkit/guard";
import { loadWorkspaceBySlug } from "@/server/billing/dev-toolkit/load-workspace";

export type DevWebhookEventType =
  | "customer.subscription.deleted"
  | "customer.subscription.updated"
  | "invoice.payment_failed";

const SUPPORTED_EVENTS: DevWebhookEventType[] = [
  "customer.subscription.deleted",
  "customer.subscription.updated",
  "invoice.payment_failed",
];

export function parseDevWebhookEvent(value: string): DevWebhookEventType {
  if (!SUPPORTED_EVENTS.includes(value as DevWebhookEventType)) {
    throw new Error(
      `Invalid event "${value}". Use: ${SUPPORTED_EVENTS.join(", ")}.`,
    );
  }
  return value as DevWebhookEventType;
}

function buildSubscriptionStub(params: {
  subscriptionId: string;
  customerId: string;
  workspaceId: string;
  plan: string;
  status?: Stripe.Subscription.Status;
}): Stripe.Subscription {
  const status = params.status ?? "active";
  return {
    id: params.subscriptionId,
    object: "subscription",
    customer: params.customerId,
    status,
    metadata: { workspaceId: params.workspaceId, plan: params.plan },
    cancel_at_period_end: false,
    items: {
      object: "list",
      data: [
        {
          id: "si_dev_stub",
          object: "subscription_item",
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          price: { id: process.env.STRIPE_PRICE_PRO ?? "price_dev_stub", object: "price" },
        } as Stripe.SubscriptionItem,
      ],
      has_more: false,
      url: "/v1/subscription_items",
    },
  } as unknown as Stripe.Subscription;
}

export type SimulateWebhookResult = {
  slug: string;
  eventType: DevWebhookEventType;
  duplicate: boolean;
};

export async function simulateWebhookForWorkspace(
  slug: string,
  options: { event: DevWebhookEventType; status?: Stripe.Subscription.Status },
): Promise<SimulateWebhookResult> {
  assertDevBillingCliEnabled();

  const workspace = await loadWorkspaceBySlug(slug);
  const subscription = workspace.subscription;

  if (!subscription) {
    throw new Error(`Workspace "${slug}" has no subscription row.`);
  }

  const subscriptionId = subscription.stripeSubscriptionId ?? `sub_dev_${workspace.id}`;
  const customerId = workspace.stripeCustomerId ?? `cus_dev_${workspace.id}`;

  const subscriptionStub = buildSubscriptionStub({
    subscriptionId,
    customerId,
    workspaceId: workspace.id,
    plan: subscription.plan,
    status: options.status ?? (options.event === "invoice.payment_failed" ? "past_due" : "active"),
  });

  let event: Stripe.Event;

  if (options.event === "invoice.payment_failed") {
    // Dev sim: equivalent to payment failure via subscription.updated → past_due (avoids Stripe API retrieve).
    event = {
      id: `evt_dev_${randomUUID()}`,
      object: "event",
      type: "customer.subscription.updated",
      data: {
        object: { ...subscriptionStub, status: "past_due" as const },
      },
    } as Stripe.Event;
  } else if (options.event === "customer.subscription.deleted") {
    event = {
      id: `evt_dev_${randomUUID()}`,
      object: "event",
      type: "customer.subscription.deleted",
      data: { object: subscriptionStub },
    } as Stripe.Event;
  } else {
    event = {
      id: `evt_dev_${randomUUID()}`,
      object: "event",
      type: "customer.subscription.updated",
      data: { object: subscriptionStub },
    } as Stripe.Event;
  }

  const result = await processStripeWebhookEvent(event);

  return {
    slug: workspace.slug,
    eventType: options.event,
    duplicate: result.duplicate,
  };
}
