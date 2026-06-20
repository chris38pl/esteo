import "server-only";

import type { SubscriptionPlan } from "@prisma/client";

import type { WorkspaceBillingPricing } from "@/features/billing/billing-page-data";
import {
  hasCatalogStripeRecurringMismatch,
  parseInvoicePreviewLines,
  parseCustomerBalanceAppliedCents,
  resolveInvoicePreview,
  resolveProrationKind,
  resolveInvoiceAdjustmentKind,
} from "@/features/billing/lib/parse-invoice-preview-lines";
import { getStripeClient } from "@/features/billing/server/stripe-client";
import type { WorkspaceBillingNextInvoice } from "@/features/billing/billing-page-data";
import {
  computeAddonMonthlyCents,
  computePlanCentsFromSubscription,
  resolveSubscriptionPlanVersion,
} from "@/server/billing/plan-pricing";
import type { WorkspaceAddonQuantityRow } from "@/server/billing/addon-catalog";

type SubscriptionBillingSnapshot = {
  id: string;
  plan: SubscriptionPlan;
  planVersion: string | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  currentPeriodEnd: Date | null;
};

type WorkspaceBillingContext = {
  workspaceId: string;
  workspaceSlug: string;
  subscription: SubscriptionBillingSnapshot | null;
  addonRows: WorkspaceAddonQuantityRow[];
};

function toCurrencyCode(value: string): "PLN" | "EUR" {
  return value.toUpperCase() === "EUR" ? "EUR" : "PLN";
}

export function computeWorkspaceBillingPricingFromDb(
  subscription: SubscriptionBillingSnapshot | null,
  addonRows: WorkspaceAddonQuantityRow[],
): Pick<
  WorkspaceBillingPricing,
  "plan" | "planVersion" | "planCents" | "addonCents" | "recurringCents" | "currency"
> {
  if (!subscription || subscription.plan === "FREE") {
    return {
      plan: "FREE",
      planVersion: subscription?.planVersion ?? null,
      planCents: 0,
      addonCents: 0,
      recurringCents: 0,
      currency: "PLN",
    };
  }

  const planCents = computePlanCentsFromSubscription(subscription);
  const addonCents = computeAddonMonthlyCents(addonRows);
  const planVersion = resolveSubscriptionPlanVersion(subscription.plan, subscription.planVersion);
  return {
    plan: subscription.plan,
    planVersion,
    planCents,
    addonCents,
    recurringCents: planCents + addonCents,
    currency: "PLN",
  };
}

function logBillingPricingComputed(params: {
  workspaceId: string;
  workspaceSlug: string;
  stripeSubscriptionId: string | null;
  pricing: WorkspaceBillingPricing;
}): void {
  console.info(
    JSON.stringify({
      event: "billing_pricing_computed",
      workspaceId: params.workspaceId,
      workspaceSlug: params.workspaceSlug,
      stripeSubscriptionId: params.stripeSubscriptionId,
      plan: params.pricing.plan,
      planVersion: params.pricing.planVersion,
      recurringCents: params.pricing.recurringCents,
      stripeRecurringCents: params.pricing.stripeRecurringCents,
      nextInvoiceCents: params.pricing.nextInvoiceCents,
      invoiceDeltaCents: params.pricing.invoiceDeltaCents,
      parsedProrationCents: params.pricing.prorationCents,
      catalogPriceMismatch: params.pricing.catalogPriceMismatch,
      recurringSource: "catalog",
      invoiceSource: params.pricing.nextInvoiceCents != null ? "stripe_preview" : null,
    }),
  );
}

function logCatalogPriceMismatch(params: {
  workspaceId: string;
  workspaceSlug: string;
  stripeSubscriptionId: string | null;
  stripeRecurringCents: number;
  catalogRecurringCents: number;
}): void {
  console.warn(
    JSON.stringify({
      event: "billing_price_catalog_mismatch",
      workspaceId: params.workspaceId,
      workspaceSlug: params.workspaceSlug,
      stripeSubscriptionId: params.stripeSubscriptionId,
      stripeRecurringCents: params.stripeRecurringCents,
      catalogRecurringCents: params.catalogRecurringCents,
    }),
  );
}

export async function buildWorkspaceBillingPricing(
  context: WorkspaceBillingContext,
): Promise<{ pricing: WorkspaceBillingPricing; nextInvoice: WorkspaceBillingNextInvoice }> {
  const base = computeWorkspaceBillingPricingFromDb(context.subscription, context.addonRows);
  const nextInvoice = await getWorkspaceUpcomingInvoice(
    context.subscription,
    base.recurringCents,
    context.workspaceId,
    context.workspaceSlug,
  );

  const stripeRecurringCents =
    nextInvoice.kind === "invoice" ? nextInvoice.recurringCents : null;
  const catalogPriceMismatch =
    stripeRecurringCents != null &&
    hasCatalogStripeRecurringMismatch(stripeRecurringCents, base.recurringCents);

  if (catalogPriceMismatch && stripeRecurringCents != null) {
    logCatalogPriceMismatch({
      workspaceId: context.workspaceId,
      workspaceSlug: context.workspaceSlug,
      stripeSubscriptionId: context.subscription?.stripeSubscriptionId ?? null,
      stripeRecurringCents,
      catalogRecurringCents: base.recurringCents,
    });
  }

  const pricing: WorkspaceBillingPricing = {
    ...base,
    nextInvoiceCents: nextInvoice.kind === "invoice" ? nextInvoice.amountCents : null,
    prorationCents: nextInvoice.kind === "invoice" ? nextInvoice.prorationCents : null,
    invoiceDeltaCents: nextInvoice.kind === "invoice" ? nextInvoice.invoiceDeltaCents : null,
    stripeRecurringCents,
    catalogPriceMismatch,
    nextInvoiceDate: nextInvoice.kind === "invoice" ? nextInvoice.date : null,
    prorationKind:
      nextInvoice.kind === "invoice"
        ? resolveProrationKind(nextInvoice.invoiceDeltaCents)
        : null,
  };

  logBillingPricingComputed({
    workspaceId: context.workspaceId,
    workspaceSlug: context.workspaceSlug,
    stripeSubscriptionId: context.subscription?.stripeSubscriptionId ?? null,
    pricing,
  });

  return { pricing, nextInvoice };
}

export async function getWorkspaceUpcomingInvoice(
  subscription: SubscriptionBillingSnapshot | null | undefined,
  catalogRecurringCents?: number,
  workspaceId?: string,
  workspaceSlug?: string,
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

    const parsed = parseInvoicePreviewLines(invoice.lines.data, invoice.amount_due);
    const resolved =
      catalogRecurringCents != null
        ? resolveInvoicePreview(parsed, catalogRecurringCents)
        : {
            ...parsed,
            invoiceDeltaCents: parsed.prorationCents,
            adjustmentKind: resolveInvoiceAdjustmentKind({
              parsedProrationCents: parsed.prorationCents,
              amountCents: parsed.amountCents,
              catalogRecurringCents: parsed.recurringCents,
              stripeRecurringCents: parsed.recurringCents,
            }),
          };

    if (
      catalogRecurringCents != null &&
      parsed.recurringCents > 0 &&
      hasCatalogStripeRecurringMismatch(parsed.recurringCents, catalogRecurringCents)
    ) {
      console.warn(
        JSON.stringify({
          event: "billing_invoice_recurring_mismatch",
          subscriptionId: subscription.id,
          workspaceId: workspaceId ?? null,
          workspaceSlug: workspaceSlug ?? null,
          catalogRecurringCents,
          stripeRecurringCents: parsed.recurringCents,
        }),
      );
    }

    const sanityDelta = Math.abs(
      parsed.recurringCents + parsed.prorationCents - parsed.amountCents,
    );
    if (sanityDelta > 1) {
      console.warn(
        JSON.stringify({
          event: "billing_invoice_sanity_mismatch",
          subscriptionId: subscription.id,
          recurringCents: parsed.recurringCents,
          prorationCents: parsed.prorationCents,
          amountCents: parsed.amountCents,
        }),
      );
    }

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
      amountCents: resolved.amountCents,
      currency: toCurrencyCode(invoice.currency),
      date: date.toISOString(),
      recurringCents: parsed.recurringCents,
      prorationCents: parsed.prorationCents,
      invoiceDeltaCents: resolved.invoiceDeltaCents,
      adjustmentKind: resolved.adjustmentKind,
      referralBalanceAppliedCents: parseCustomerBalanceAppliedCents(invoice),
    };
  } catch {
    return getUpcomingInvoiceFallback(stripe, subscription, catalogRecurringCents);
  }
}

async function getUpcomingInvoiceFallback(
  stripe: ReturnType<typeof getStripeClient>,
  subscription: SubscriptionBillingSnapshot,
  catalogRecurringCents?: number,
): Promise<WorkspaceBillingNextInvoice> {
  if (!subscription.stripeSubscriptionId || !subscription.currentPeriodEnd) {
    return { kind: "none", reason: "no_subscription" };
  }

  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId,
    );
    const amountCents =
      catalogRecurringCents ??
      stripeSubscription.items.data.reduce(
        (sum, item) => sum + (item.price.unit_amount ?? 0) * (item.quantity ?? 1),
        0,
      );

    if (amountCents <= 0) {
      return { kind: "none", reason: "no_subscription" };
    }

    const currency = toCurrencyCode(
      stripeSubscription.items.data[0]?.price.currency ?? "pln",
    );

    const invoiceDeltaCents =
      catalogRecurringCents != null
        ? resolveInvoicePreview(
            {
              recurringCents: amountCents,
              prorationCents: 0,
              amountCents,
            },
            catalogRecurringCents,
          ).invoiceDeltaCents
        : 0;

    const adjustmentKind =
      catalogRecurringCents != null
        ? resolveInvoicePreview(
            {
              recurringCents: amountCents,
              prorationCents: 0,
              amountCents,
            },
            catalogRecurringCents,
          ).adjustmentKind
        : ("none" as const);

    return {
      kind: "invoice",
      amountCents,
      currency,
      date: subscription.currentPeriodEnd.toISOString(),
      recurringCents: amountCents,
      prorationCents: 0,
      invoiceDeltaCents,
      adjustmentKind,
      referralBalanceAppliedCents: 0,
    };
  } catch {
    return { kind: "none", reason: "no_subscription" };
  }
}
