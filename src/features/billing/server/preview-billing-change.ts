import "server-only";

import type { SubscriptionPlan } from "@prisma/client";
import type Stripe from "stripe";

import type {
  BillingChangePreview,
  BillingChangePreviewInput,
} from "@/features/billing/billing-page-data";
import { PREVIEW_TTL_MS } from "@/features/billing/billing-page-data";
import {
  parseInvoicePreviewLines,
  resolveInvoiceDeltaCents,
  resolveProrationKind,
} from "@/features/billing/lib/parse-invoice-preview-lines";
import { BillingError } from "@/features/billing/server/billing-errors";
import { getStripeClient } from "@/features/billing/server/stripe-client";
import {
  classifySubscriptionItems,
} from "@/features/billing/server/stripe-subscription-items";
import {
  findBasePlanSubscriptionItem,
  priceIdForPlan,
} from "@/features/billing/server/stripe-plan-utils";
import {
  assertAddonQuantityBounds,
  canPurchaseSeatAddon,
  canPurchaseStorageAddon,
  priceIdForAddon,
} from "@/server/billing/addon-catalog";
import {
  computeAddonMonthlyCents,
  computePlanCentsFromSubscription,
  resolveCurrentPlanPrice,
} from "@/server/billing/plan-pricing";
import { prisma } from "@/db/client";
import { WorkspaceError } from "@/server/permissions/errors";
import { loadWorkspaceAddonQuantities } from "@/features/billing/server/workspace-addon-sync";

type LoadedSubscription = {
  id: string;
  plan: SubscriptionPlan;
  planVersion: string | null;
  status: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
};

async function loadPaidSubscription(workspaceId: string): Promise<LoadedSubscription> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      billingAccount: {
        select: {
          subscription: {
            select: {
              id: true,
              plan: true,
              planVersion: true,
              status: true,
              stripeSubscriptionId: true,
              stripeCustomerId: true,
            },
          },
        },
      },
    },
  });

  const subscription = workspace?.billingAccount?.subscription;
  if (!subscription) {
    throw new WorkspaceError("Workspace has no subscription.");
  }

  if (
    subscription.plan === "FREE" ||
    !subscription.stripeSubscriptionId ||
    !subscription.stripeCustomerId
  ) {
    throw new WorkspaceError("Preview requires an active paid subscription.");
  }

  return {
    ...subscription,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    stripeCustomerId: subscription.stripeCustomerId,
  };
}

function buildAddonPreviewItems(params: {
  subscription: Stripe.Subscription;
  plan: SubscriptionPlan;
  storageQuantity: number;
  seatQuantity: number;
}): Stripe.InvoiceCreatePreviewParams.SubscriptionDetails.Item[] {
  const classified = classifySubscriptionItems(params.subscription);
  const items: Stripe.InvoiceCreatePreviewParams.SubscriptionDetails.Item[] = [];

  if (classified.baseItem) {
    items.push({ id: classified.baseItem.id });
  }

  if (params.storageQuantity > 0) {
    if (classified.storageItem) {
      items.push({ id: classified.storageItem.id, quantity: params.storageQuantity });
    } else {
      items.push({ price: priceIdForAddon("STORAGE"), quantity: params.storageQuantity });
    }
  } else if (classified.storageItem) {
    items.push({ id: classified.storageItem.id, deleted: true });
  }

  if (canPurchaseSeatAddon(params.plan) && params.seatQuantity > 0) {
    if (classified.seatItem) {
      items.push({ id: classified.seatItem.id, quantity: params.seatQuantity });
    } else {
      items.push({ price: priceIdForAddon("SEATS"), quantity: params.seatQuantity });
    }
  } else if (classified.seatItem) {
    items.push({ id: classified.seatItem.id, deleted: true });
  }

  return items;
}

function buildPlanUpgradePreviewItems(params: {
  subscription: Stripe.Subscription;
  targetPlan: Exclude<SubscriptionPlan, "FREE">;
}): Stripe.InvoiceCreatePreviewParams.SubscriptionDetails.Item[] {
  const classified = classifySubscriptionItems(params.subscription);
  const baseItem = classified.baseItem ?? findBasePlanSubscriptionItem(params.subscription);
  if (!baseItem) {
    throw new BillingError("Stripe subscription has no base plan line item.");
  }

  const items: Stripe.InvoiceCreatePreviewParams.SubscriptionDetails.Item[] = [
    { id: baseItem.id, price: priceIdForPlan(params.targetPlan) },
  ];

  const storageQuantity = classified.storageItem?.quantity ?? 0;
  if (storageQuantity > 0 && classified.storageItem) {
    items.push({ id: classified.storageItem.id, quantity: storageQuantity });
  }

  if (params.targetPlan === "BUSINESS") {
    const seatQuantity = classified.seatItem?.quantity ?? 0;
    if (seatQuantity > 0 && classified.seatItem) {
      items.push({ id: classified.seatItem.id, quantity: seatQuantity });
    }
  } else if (classified.seatItem) {
    items.push({ id: classified.seatItem.id, deleted: true });
  }

  return items;
}

function catalogRecurringAfterChange(
  subscription: LoadedSubscription,
  input: BillingChangePreviewInput,
  addonRows: { addonKey: string; quantity: number }[],
): number {
  if (input.kind === "plan") {
    const planCents = resolveCurrentPlanPrice(input.targetPlan);
    const addonCents = computeAddonMonthlyCents(
      addonRows.map((row) => ({
        addonKey: row.addonKey as "STORAGE" | "SEATS",
        quantity: row.quantity,
      })),
    );
    return planCents + addonCents;
  }

  const planCents = computePlanCentsFromSubscription(subscription);
  const addonCents = computeAddonMonthlyCents([
    { addonKey: "STORAGE", quantity: input.storageQuantity },
    { addonKey: "SEATS", quantity: input.seatQuantity },
  ]);
  return planCents + addonCents;
}

function toPreviewResponse(
  parsed: ReturnType<typeof parseInvoicePreviewLines>,
  currency: string,
  recurringCents: number,
): BillingChangePreview {
  const now = new Date();
  const prorationCents = parsed.prorationCents;
  const invoiceDeltaCents = resolveInvoiceDeltaCents({
    amountCents: parsed.amountCents,
    catalogRecurringCents: recurringCents,
    parsedProrationCents: prorationCents,
  });
  return {
    recurringCents,
    prorationCents,
    invoiceDeltaCents,
    prorationKind: resolveProrationKind(invoiceDeltaCents),
    nextInvoiceCents: parsed.amountCents,
    currency: currency.toUpperCase() === "EUR" ? "EUR" : "PLN",
    previewGeneratedAt: now.toISOString(),
    previewExpiresAt: new Date(now.getTime() + PREVIEW_TTL_MS).toISOString(),
  };
}

export async function previewWorkspaceBillingChange(params: {
  workspaceId: string;
  change: BillingChangePreviewInput;
}): Promise<BillingChangePreview> {
  const [addonRows, subscription] = await Promise.all([
    loadWorkspaceAddonQuantities(params.workspaceId),
    loadPaidSubscription(params.workspaceId),
  ]);

  if (params.change.kind === "plan") {
    const planOrder: SubscriptionPlan[] = ["FREE", "PRO", "BUSINESS"];
    const currentIndex = planOrder.indexOf(subscription.plan);
    const targetIndex = planOrder.indexOf(params.change.targetPlan);

    if (targetIndex <= currentIndex) {
      const recurringCents = catalogRecurringAfterChange(subscription, params.change, addonRows);
      return toPreviewResponse(
        { recurringCents, prorationCents: 0, amountCents: recurringCents },
        "pln",
        recurringCents,
      );
    }
  }

  if (params.change.kind === "addons") {
    assertAddonQuantityBounds("STORAGE", params.change.storageQuantity);
    assertAddonQuantityBounds("SEATS", params.change.seatQuantity);
    if (!canPurchaseStorageAddon(subscription.plan) && params.change.storageQuantity > 0) {
      throw new WorkspaceError("Storage add-ons are not available on this plan.");
    }
    if (!canPurchaseSeatAddon(subscription.plan) && params.change.seatQuantity > 0) {
      throw new WorkspaceError("Seat add-ons are only available on the Business plan.");
    }
  }

  const stripe = getStripeClient();
  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.stripeSubscriptionId,
  );

  const items =
    params.change.kind === "plan"
      ? buildPlanUpgradePreviewItems({
          subscription: stripeSubscription,
          targetPlan: params.change.targetPlan,
        })
      : buildAddonPreviewItems({
          subscription: stripeSubscription,
          plan: subscription.plan,
          storageQuantity: params.change.storageQuantity,
          seatQuantity: params.change.seatQuantity,
        });

  const invoice = await stripe.invoices.createPreview({
    customer: subscription.stripeCustomerId,
    subscription: subscription.stripeSubscriptionId,
    subscription_details: {
      items,
      proration_behavior: "create_prorations",
    },
  });

  const parsed = parseInvoicePreviewLines(invoice.lines.data, invoice.amount_due);
  const recurringCents = catalogRecurringAfterChange(subscription, params.change, addonRows);

  return toPreviewResponse(parsed, invoice.currency, recurringCents);
}
