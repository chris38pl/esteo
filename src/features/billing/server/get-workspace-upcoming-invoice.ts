import "server-only";

import type { SubscriptionPlan } from "@prisma/client";

import { getStripeClient } from "@/features/billing/server/stripe-client";
import type { WorkspaceBillingNextInvoice } from "@/features/billing/billing-page-data";

type SubscriptionBillingSnapshot = {
  plan: SubscriptionPlan;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  currentPeriodEnd: Date | null;
};

function toCurrencyCode(value: string): "PLN" | "EUR" {
  return value.toUpperCase() === "EUR" ? "EUR" : "PLN";
}

export async function getWorkspaceUpcomingInvoice(
  subscription: SubscriptionBillingSnapshot | null | undefined,
): Promise<WorkspaceBillingNextInvoice> {
  if (!subscription || subscription.plan === "FREE") {
    return { kind: "none", reason: "free_plan" };
  }

  if (subscription.cancelAtPeriodEnd) {
    return { kind: "none", reason: "canceling" };
  }

  const { stripeCustomerId, stripeSubscriptionId } = subscription;
  if (!stripeCustomerId || !stripeSubscriptionId) {
    return { kind: "none", reason: "no_subscription" };
  }

  const stripe = getStripeClient();

  try {
    const invoice = await stripe.invoices.createPreview({
      customer: stripeCustomerId,
      subscription: stripeSubscriptionId,
    });

    const timestamp =
      invoice.next_payment_attempt ?? invoice.period_end ?? null;
    const date =
      timestamp != null
        ? new Date(timestamp * 1000)
        : subscription.currentPeriodEnd;

    if (!date) {
      return { kind: "none", reason: "no_subscription" };
    }

    return {
      kind: "invoice",
      amountCents: invoice.amount_due,
      currency: toCurrencyCode(invoice.currency),
      date: date.toISOString(),
    };
  } catch {
    return getUpcomingInvoiceFallback(stripe, subscription);
  }
}

async function getUpcomingInvoiceFallback(
  stripe: ReturnType<typeof getStripeClient>,
  subscription: SubscriptionBillingSnapshot,
): Promise<WorkspaceBillingNextInvoice> {
  if (!subscription.stripeSubscriptionId || !subscription.currentPeriodEnd) {
    return { kind: "none", reason: "no_subscription" };
  }

  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId,
    );
    const price = stripeSubscription.items.data[0]?.price;
    const amountCents = price?.unit_amount;

    if (amountCents == null) {
      return { kind: "none", reason: "no_subscription" };
    }

    return {
      kind: "invoice",
      amountCents,
      currency: toCurrencyCode(price.currency ?? "pln"),
      date: subscription.currentPeriodEnd.toISOString(),
    };
  } catch {
    return { kind: "none", reason: "no_subscription" };
  }
}
