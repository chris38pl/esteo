import type { AddonKey } from "@prisma/client";
import type Stripe from "stripe";

import { addonKeyFromPriceId } from "@/server/billing/addon-catalog";
import {
  extractStripePriceId,
  findBasePlanSubscriptionItem,
  planFromPriceId,
} from "@/features/billing/server/stripe-plan-utils";

export type ClassifiedSubscriptionItem = {
  item: Stripe.SubscriptionItem;
  priceId: string;
  addonKey: AddonKey | null;
  plan: ReturnType<typeof planFromPriceId>;
};

export type ClassifiedSubscriptionItems = {
  baseItem: Stripe.SubscriptionItem | null;
  storageItem: Stripe.SubscriptionItem | null;
  seatItem: Stripe.SubscriptionItem | null;
  all: ClassifiedSubscriptionItem[];
};

function classifyItem(item: Stripe.SubscriptionItem): ClassifiedSubscriptionItem {
  const priceId = extractStripePriceId(item) ?? "";
  const addonKey = addonKeyFromPriceId(priceId);
  const plan = addonKey ? null : planFromPriceId(priceId);

  return {
    item,
    priceId,
    addonKey,
    plan,
  };
}

export function classifySubscriptionItems(
  subscription: Stripe.Subscription,
): ClassifiedSubscriptionItems {
  const all = subscription.items.data.map(classifyItem);

  let baseItem: Stripe.SubscriptionItem | null = null;
  let storageItem: Stripe.SubscriptionItem | null = null;
  let seatItem: Stripe.SubscriptionItem | null = null;

  for (const row of all) {
    if (row.addonKey === "STORAGE") {
      storageItem = row.item;
      continue;
    }

    if (row.addonKey === "SEATS") {
      seatItem = row.item;
      continue;
    }

    if (row.plan && !baseItem) {
      baseItem = row.item;
    }
  }

  if (!baseItem) {
    const fallback = findBasePlanSubscriptionItem(subscription);
    if (fallback) {
      baseItem = fallback;
    }
  }

  return { baseItem, storageItem, seatItem, all };
}

export function getBasePlanSubscriptionItem(
  subscription: Stripe.Subscription,
): Stripe.SubscriptionItem | undefined {
  return findBasePlanSubscriptionItem(subscription);
}

export type SchedulePhaseItem = {
  price: string;
  quantity: number;
};

export function buildSchedulePhaseItems(params: {
  basePriceId: string;
  storageQuantity: number;
  seatQuantity: number;
  includeSeatAddons: boolean;
}): SchedulePhaseItem[] {
  const items: SchedulePhaseItem[] = [{ price: params.basePriceId, quantity: 1 }];

  if (params.storageQuantity > 0) {
    const storagePriceId = process.env.STRIPE_PRICE_ADDON_STORAGE;
    if (storagePriceId) {
      items.push({ price: storagePriceId, quantity: params.storageQuantity });
    }
  }

  if (params.includeSeatAddons && params.seatQuantity > 0) {
    const seatPriceId = process.env.STRIPE_PRICE_ADDON_SEATS;
    if (seatPriceId) {
      items.push({ price: seatPriceId, quantity: params.seatQuantity });
    }
  }

  return items;
}
