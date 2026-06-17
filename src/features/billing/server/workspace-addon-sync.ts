import type { AddonKey, SubscriptionPlan } from "@prisma/client";
import type Stripe from "stripe";

import { prisma } from "@/db/client";
import { getStripeClient } from "@/features/billing/server/stripe-client";
import {
  classifySubscriptionItems,
} from "@/features/billing/server/stripe-subscription-items";
import { extractStripePriceId } from "@/features/billing/server/stripe-plan-utils";
import { canPurchaseSeatAddon } from "@/server/billing/addon-catalog";
import { syncWorkspaceEffectiveLimits } from "@/server/billing/workspace-plan-sync";

type AddonSyncRow = {
  addonKey: AddonKey;
  quantity: number;
  stripeSubscriptionItemId: string;
  stripePriceId: string;
};

function itemQuantity(item: Stripe.SubscriptionItem): number {
  return item.quantity ?? 1;
}

async function deleteStripeSubscriptionItem(itemId: string): Promise<void> {
  const stripe = getStripeClient();
  await stripe.subscriptionItems.del(itemId);
}

/**
 * Syncs WorkspaceAddon rows from Stripe subscription items.
 * Strips seat items on non-BUSINESS plans (defense in depth).
 */
export async function syncWorkspaceAddonsFromStripe(params: {
  workspaceId: string;
  plan: SubscriptionPlan;
  stripeSubscription: Stripe.Subscription;
}): Promise<void> {
  const classified = classifySubscriptionItems(params.stripeSubscription);
  const rows: AddonSyncRow[] = [];

  if (classified.storageItem) {
    const quantity = itemQuantity(classified.storageItem);
    const priceId = extractStripePriceId(classified.storageItem);
    if (quantity > 0 && priceId) {
      rows.push({
        addonKey: "STORAGE",
        quantity,
        stripeSubscriptionItemId: classified.storageItem.id,
        stripePriceId: priceId,
      });
    }
  }

  if (classified.seatItem) {
    const quantity = itemQuantity(classified.seatItem);
    const priceId = extractStripePriceId(classified.seatItem);

    if (!canPurchaseSeatAddon(params.plan)) {
      if (classified.seatItem.id) {
        await deleteStripeSubscriptionItem(classified.seatItem.id);
      }
    } else if (quantity > 0 && priceId) {
      rows.push({
        addonKey: "SEATS",
        quantity,
        stripeSubscriptionItemId: classified.seatItem.id,
        stripePriceId: priceId,
      });
    }
  }

  const purchasableKeys = new Set(rows.map((row) => row.addonKey));

  for (const row of rows) {
    await prisma.workspaceAddon.upsert({
      where: {
        workspaceId_addonKey: {
          workspaceId: params.workspaceId,
          addonKey: row.addonKey,
        },
      },
      create: {
        workspaceId: params.workspaceId,
        addonKey: row.addonKey,
        quantity: row.quantity,
        status: "ACTIVE",
        stripeSubscriptionItemId: row.stripeSubscriptionItemId,
        stripePriceId: row.stripePriceId,
        effectiveUntil: null,
      },
      update: {
        quantity: row.quantity,
        status: "ACTIVE",
        stripeSubscriptionItemId: row.stripeSubscriptionItemId,
        stripePriceId: row.stripePriceId,
        effectiveUntil: null,
      },
    });
  }

  const keysToClear = (["STORAGE", "SEATS"] as AddonKey[]).filter(
    (key) => !purchasableKeys.has(key),
  );

  if (keysToClear.length > 0) {
    await prisma.workspaceAddon.updateMany({
      where: {
        workspaceId: params.workspaceId,
        addonKey: { in: keysToClear },
      },
      data: {
        quantity: 0,
        status: "CANCELED",
        stripeSubscriptionItemId: null,
        stripePriceId: null,
        effectiveUntil: null,
      },
    });
  }

  await syncWorkspaceEffectiveLimits(params.workspaceId);
}

export async function cancelAllWorkspaceAddons(workspaceId: string): Promise<void> {
  await prisma.workspaceAddon.updateMany({
    where: { workspaceId },
    data: {
      quantity: 0,
      status: "CANCELED",
      stripeSubscriptionItemId: null,
      stripePriceId: null,
      effectiveUntil: null,
    },
  });

  await syncWorkspaceEffectiveLimits(workspaceId);
}

export async function loadWorkspaceAddonQuantities(
  workspaceId: string,
): Promise<Array<{ addonKey: AddonKey; quantity: number }>> {
  const rows = await prisma.workspaceAddon.findMany({
    where: { workspaceId, status: "ACTIVE", quantity: { gt: 0 } },
    select: { addonKey: true, quantity: true },
  });

  return rows;
}
