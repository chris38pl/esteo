import type { AddonKey, SubscriptionPlan } from "@prisma/client";

const MB = 1024 * 1024;
const GB = 1024 * MB;

export const STORAGE_UNIT_BYTES = 10 * GB;
export const SEAT_UNIT_COUNT = 5;

export const MAX_ADDON_QUANTITY: Record<"STORAGE" | "SEATS", number> = {
  STORAGE: 10,
  SEATS: 10,
};

export type PurchasableAddonKey = "STORAGE" | "SEATS";

export type AddonDeltas = {
  extraStorageBytes: number;
  extraInvitedSeats: number;
};

export type WorkspaceAddonQuantityRow = {
  addonKey: AddonKey;
  quantity: number;
};

export function priceIdForAddon(addonKey: PurchasableAddonKey): string {
  if (addonKey === "STORAGE") {
    const priceId = process.env.STRIPE_PRICE_ADDON_STORAGE;
    if (!priceId) {
      throw new Error("STRIPE_PRICE_ADDON_STORAGE is not configured.");
    }
    return priceId;
  }

  const priceId = process.env.STRIPE_PRICE_ADDON_SEATS;
  if (!priceId) {
    throw new Error("STRIPE_PRICE_ADDON_SEATS is not configured.");
  }
  return priceId;
}

export function addonKeyFromPriceId(priceId: string | null): PurchasableAddonKey | null {
  if (!priceId) {
    return null;
  }

  if (process.env.STRIPE_PRICE_ADDON_STORAGE === priceId) {
    return "STORAGE";
  }

  if (process.env.STRIPE_PRICE_ADDON_SEATS === priceId) {
    return "SEATS";
  }

  return null;
}

export function canPurchaseStorageAddon(plan: SubscriptionPlan): boolean {
  return plan === "PRO" || plan === "BUSINESS";
}

export function canPurchaseSeatAddon(plan: SubscriptionPlan): boolean {
  return plan === "BUSINESS";
}

export function assertAddonQuantityBounds(
  addonKey: PurchasableAddonKey,
  quantity: number,
): void {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_ADDON_QUANTITY[addonKey]) {
    throw new Error(`Invalid ${addonKey} addon quantity.`);
  }
}

export function resolveAddonDeltas(
  plan: SubscriptionPlan,
  addons: WorkspaceAddonQuantityRow[],
): AddonDeltas {
  const storageQty =
    addons.find((row) => row.addonKey === "STORAGE" && row.quantity > 0)?.quantity ?? 0;
  const seatQty =
    plan === "BUSINESS"
      ? (addons.find((row) => row.addonKey === "SEATS" && row.quantity > 0)?.quantity ?? 0)
      : 0;

  return {
    extraStorageBytes: storageQty * STORAGE_UNIT_BYTES,
    extraInvitedSeats: seatQty * SEAT_UNIT_COUNT,
  };
}

export function mergePlanLimitsWithAddons(
  baseLimits: import("@/server/billing/plan-catalog").PlanLimits,
  deltas: AddonDeltas,
): import("@/server/billing/plan-catalog").PlanLimits {
  const baseSeats = baseLimits.maxInvitedSeats ?? 0;

  return {
    ...baseLimits,
    maxStorageBytes: baseLimits.maxStorageBytes + deltas.extraStorageBytes,
    maxInvitedSeats: baseSeats + deltas.extraInvitedSeats,
  };
}

/** Suggested unit prices (PLN) — mirrored in Stripe Price setup and i18n. */
export const ADDON_UNIT_PRICES_PLN: Record<PurchasableAddonKey, number> = {
  STORAGE: 39,
  SEATS: 99,
};
