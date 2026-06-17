import "server-only";

import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";

import { prisma } from "@/db/client";
import { BillingError } from "@/features/billing/server/billing-errors";
import { getStripeClient } from "@/features/billing/server/stripe-client";
import {
  classifySubscriptionItems,
} from "@/features/billing/server/stripe-subscription-items";
import { syncSubscriptionFromStripe } from "@/features/billing/server/subscription-sync";
import {
  assertAddonQuantityBounds,
  canPurchaseSeatAddon,
  canPurchaseStorageAddon,
  priceIdForAddon,
  resolveAddonDeltas,
  type PurchasableAddonKey,
} from "@/server/billing/addon-catalog";
import { getSeatUsage } from "@/server/billing/entitlement-service";
import { resolvePlanLimits } from "@/server/billing/plan-catalog";
import { WorkspaceError } from "@/server/permissions/errors";

const ACTIVE_PAID_STATUSES = new Set<SubscriptionStatus>(["ACTIVE", "TRIAL"]);

type WorkspaceSubscriptionRow = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeSubscriptionId: string | null;
  planVersion: string | null;
};

async function loadWorkspaceSubscription(workspaceId: string): Promise<WorkspaceSubscriptionRow> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      billingAccount: {
        select: {
          subscription: {
            select: {
              plan: true,
              status: true,
              stripeSubscriptionId: true,
              planVersion: true,
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

  return subscription;
}

function assertPaidSubscription(subscription: WorkspaceSubscriptionRow): string {
  if (
    !subscription.stripeSubscriptionId ||
    !ACTIVE_PAID_STATUSES.has(subscription.status)
  ) {
    throw new WorkspaceError("Add-ons require an active paid subscription.");
  }

  return subscription.stripeSubscriptionId;
}

function assertCanChangeAddon(plan: SubscriptionPlan, addonKey: PurchasableAddonKey): void {
  if (plan === "FREE") {
    throw new WorkspaceError("Upgrade to a paid plan before purchasing add-ons.");
  }

  if (addonKey === "STORAGE" && !canPurchaseStorageAddon(plan)) {
    throw new WorkspaceError("Storage add-ons are not available on this plan.");
  }

  if (addonKey === "SEATS" && !canPurchaseSeatAddon(plan)) {
    throw new WorkspaceError("Seat add-ons are only available on the Business plan.");
  }
}

async function assertSeatQuantityAllowed(
  workspaceId: string,
  plan: SubscriptionPlan,
  planVersion: string | null,
  storageQty: number,
  nextSeatQty: number,
): Promise<void> {
  const baseLimits = resolvePlanLimits(plan, planVersion);
  const deltas = resolveAddonDeltas(plan, [
    { addonKey: "STORAGE", quantity: storageQty },
    { addonKey: "SEATS", quantity: nextSeatQty },
  ]);
  const effectiveSeatLimit = (baseLimits.maxInvitedSeats ?? 0) + deltas.extraInvitedSeats;
  const seats = await getSeatUsage(workspaceId);

  if (seats.used + seats.reserved > effectiveSeatLimit) {
    throw new WorkspaceError(
      "Remove team members or pending invites before reducing seat add-ons.",
    );
  }
}

function buildStripeItemUpdates(params: {
  subscription: Stripe.Subscription;
  addonKey: PurchasableAddonKey;
  quantity: number;
  plan: SubscriptionPlan;
}): Stripe.SubscriptionUpdateParams.Item[] {
  const classified = classifySubscriptionItems(params.subscription);
  const items: Stripe.SubscriptionUpdateParams.Item[] = [];

  if (classified.baseItem) {
    items.push({ id: classified.baseItem.id });
  }

  const nextStorageQty =
    params.addonKey === "STORAGE"
      ? params.quantity
      : (classified.storageItem?.quantity ?? 0);
  const nextSeatQty =
    params.addonKey === "SEATS"
      ? params.quantity
      : (classified.seatItem?.quantity ?? 0);

  if (nextStorageQty > 0) {
    if (classified.storageItem) {
      items.push({ id: classified.storageItem.id, quantity: nextStorageQty });
    } else {
      items.push({ price: priceIdForAddon("STORAGE"), quantity: nextStorageQty });
    }
  } else if (classified.storageItem) {
    items.push({ id: classified.storageItem.id, deleted: true });
  }

  if (canPurchaseSeatAddon(params.plan) && nextSeatQty > 0) {
    if (classified.seatItem) {
      items.push({ id: classified.seatItem.id, quantity: nextSeatQty });
    } else {
      items.push({ price: priceIdForAddon("SEATS"), quantity: nextSeatQty });
    }
  } else if (classified.seatItem) {
    items.push({ id: classified.seatItem.id, deleted: true });
  }

  return items;
}

export async function changeWorkspaceAddonQuantity(params: {
  workspaceId: string;
  addonKey: PurchasableAddonKey;
  quantity: number;
}): Promise<{ ok: true }> {
  assertAddonQuantityBounds(params.addonKey, params.quantity);

  const subscription = await loadWorkspaceSubscription(params.workspaceId);
  assertCanChangeAddon(subscription.plan, params.addonKey);
  const stripeSubscriptionId = assertPaidSubscription(subscription);

  const stripe = getStripeClient();
  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const classified = classifySubscriptionItems(stripeSubscription);
  const currentStorageQty = classified.storageItem?.quantity ?? 0;
  const currentSeatQty = classified.seatItem?.quantity ?? 0;

  if (params.addonKey === "SEATS") {
    await assertSeatQuantityAllowed(
      params.workspaceId,
      subscription.plan,
      subscription.planVersion,
      currentStorageQty,
      params.quantity,
    );
  }

  const items = buildStripeItemUpdates({
    subscription: stripeSubscription,
    addonKey: params.addonKey,
    quantity: params.quantity,
    plan: subscription.plan,
  });

  if (items.length === 0) {
    throw new BillingError("Unable to update subscription items.");
  }

  const updated = await stripe.subscriptions.update(stripeSubscriptionId, {
    items,
    proration_behavior: "create_prorations",
  });

  const stripeCustomerId =
    typeof updated.customer === "string" ? updated.customer : updated.customer?.id;

  if (!stripeCustomerId) {
    throw new BillingError("Stripe subscription is missing a customer.");
  }

  await syncSubscriptionFromStripe(updated, stripeCustomerId, {
    planHint: subscription.plan,
  });

  return { ok: true };
}
