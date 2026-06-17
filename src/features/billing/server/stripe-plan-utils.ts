import type { SubscriptionPlan } from "@prisma/client";
import type Stripe from "stripe";

import { BillingPlanResolutionError } from "@/features/billing/server/billing-errors";
import { addonKeyFromPriceId } from "@/server/billing/addon-catalog";
import { WorkspaceError } from "@/server/permissions/errors";

const STRIPE_PRICE_TO_PLAN: Record<string, SubscriptionPlan> = {};

function loadPricePlanMap() {
  if (process.env.STRIPE_PRICE_PRO) {
    STRIPE_PRICE_TO_PLAN[process.env.STRIPE_PRICE_PRO] = "PRO";
  }

  if (process.env.STRIPE_PRICE_BUSINESS) {
    STRIPE_PRICE_TO_PLAN[process.env.STRIPE_PRICE_BUSINESS] = "BUSINESS";
  }
}

export function priceIdForPlan(plan: SubscriptionPlan): string {
  if (plan === "PRO") {
    if (!process.env.STRIPE_PRICE_PRO) {
      throw new WorkspaceError("STRIPE_PRICE_PRO is not configured.");
    }
    return process.env.STRIPE_PRICE_PRO;
  }

  if (plan === "BUSINESS") {
    if (!process.env.STRIPE_PRICE_BUSINESS) {
      throw new WorkspaceError("STRIPE_PRICE_BUSINESS is not configured.");
    }
    return process.env.STRIPE_PRICE_BUSINESS;
  }

  throw new WorkspaceError("FREE plans do not require a Stripe price.");
}

export function extractStripePriceId(
  item: Stripe.SubscriptionItem | undefined,
): string | null {
  if (!item?.price) {
    return null;
  }

  return typeof item.price === "string" ? item.price : (item.price.id ?? null);
}

export function planFromPriceId(priceId: string | null): SubscriptionPlan | null {
  if (!priceId) {
    return null;
  }

  loadPricePlanMap();
  return STRIPE_PRICE_TO_PLAN[priceId] ?? null;
}

export function findBasePlanSubscriptionItem(
  subscription: Stripe.Subscription,
): Stripe.SubscriptionItem | undefined {
  for (const item of subscription.items.data) {
    const priceId = extractStripePriceId(item);
    if (priceId && !addonKeyFromPriceId(priceId) && planFromPriceId(priceId)) {
      return item;
    }
  }

  const first = subscription.items.data[0];
  if (first && !addonKeyFromPriceId(extractStripePriceId(first))) {
    return first;
  }

  return undefined;
}

export function resolvePlanFromStripeSubscription(
  subscription: Stripe.Subscription,
  options?: { planHint?: string | null },
): SubscriptionPlan {
  loadPricePlanMap();

  if (options?.planHint) {
    const hinted = options.planHint.toUpperCase();
    if (hinted === "PRO" || hinted === "BUSINESS") {
      return hinted;
    }
  }

  const metadataPlan = subscription.metadata.plan?.toUpperCase();
  if (metadataPlan === "PRO" || metadataPlan === "BUSINESS") {
    return metadataPlan;
  }

  const priceId = extractStripePriceId(findBasePlanSubscriptionItem(subscription));
  const mappedPlan = priceId ? STRIPE_PRICE_TO_PLAN[priceId] : null;
  if (mappedPlan) {
    return mappedPlan;
  }

  const detail = `subscription=${subscription.id} priceId=${priceId ?? "none"} metadata=${metadataPlan ?? "none"}`;
  console.error(`[billing] Plan resolution failed: ${detail}`);
  throw new BillingPlanResolutionError(
    "Unable to resolve subscription plan. Please retry from billing settings or contact support.",
  );
}

export function getSubscriptionScheduleId(
  subscription: Stripe.Subscription,
): string | null {
  if (!subscription.schedule) {
    return null;
  }

  return typeof subscription.schedule === "string"
    ? subscription.schedule
    : subscription.schedule.id;
}

/**
 * Stripe Customer Portal sets `cancel_at` (timestamp) without `cancel_at_period_end`.
 * In-app cancel uses `cancel_at_period_end: true`. Treat both as scheduled cancellation.
 */
export function isStripeSubscriptionScheduledToCancel(
  stripeSubscription: Stripe.Subscription,
): boolean {
  if (stripeSubscription.cancel_at_period_end) {
    return true;
  }

  const cancelAt = stripeSubscription.cancel_at;
  if (cancelAt == null) {
    return false;
  }

  const status = stripeSubscription.status;
  if (status !== "active" && status !== "trialing") {
    return false;
  }

  return cancelAt > Math.floor(Date.now() / 1000);
}
