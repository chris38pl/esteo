import type { SubscriptionPlan } from "@prisma/client";

import { DEFAULT_PLAN_VERSION } from "@/server/billing/plan-catalog";
import {
  ADDON_UNIT_PRICES_PLN,
  type PurchasableAddonKey,
  type WorkspaceAddonQuantityRow,
} from "@/server/billing/addon-catalog";

/**
 * Monthly plan prices in grosze, keyed by planVersion (same keys as PLAN_CATALOG).
 *
 * Lifecycle rule: never remove a version while active subscriptions still pin it.
 * Missing entry → resolvePlanPrice throws (fail-fast).
 */
export const PLAN_PRICES_PLN: Record<string, number> = {
  PRO_2026: 9999,
  BUSINESS_2026: 24999,
};

export function resolvePlanPrice(planVersion: string): number {
  const cents = PLAN_PRICES_PLN[planVersion];
  if (cents == null) {
    throw new Error(`Missing PLAN_PRICES entry for ${planVersion}`);
  }
  return cents;
}

/** Current catalog price for marketing (hero / plans page) — not pinned subscription state. */
export function resolveCurrentPlanPrice(plan: SubscriptionPlan): number {
  if (plan === "FREE") {
    return 0;
  }
  return resolvePlanPrice(DEFAULT_PLAN_VERSION[plan]);
}

export function addonUnitPriceCents(addonKey: PurchasableAddonKey): number {
  return ADDON_UNIT_PRICES_PLN[addonKey] * 100;
}

export function computeAddonMonthlyCents(addons: WorkspaceAddonQuantityRow[]): number {
  let total = 0;
  for (const row of addons) {
    if (row.quantity <= 0) {
      continue;
    }
    if (row.addonKey === "STORAGE") {
      total += row.quantity * addonUnitPriceCents("STORAGE");
    } else if (row.addonKey === "SEATS") {
      total += row.quantity * addonUnitPriceCents("SEATS");
    }
  }
  return total;
}

type SubscriptionPlanVersionInput = {
  id: string;
  plan: SubscriptionPlan;
  planVersion: string | null;
};

/**
 * Resolves the pinned catalog version for pricing. Null or unknown versions fall back to the
 * plan's current default — same rule as resolvePlanLimits and the schema comment on planVersion.
 */
export function resolveSubscriptionPlanVersion(
  plan: SubscriptionPlan,
  planVersion?: string | null,
): string {
  if (planVersion && PLAN_PRICES_PLN[planVersion] != null) {
    return planVersion;
  }
  return DEFAULT_PLAN_VERSION[plan];
}

export function assertSubscriptionPlanVersion(subscription: SubscriptionPlanVersionInput): void {
  if (subscription.plan === "FREE") {
    return;
  }
  if (!subscription.planVersion) {
    console.warn(
      JSON.stringify({
        event: "subscription_plan_version_missing",
        subscriptionId: subscription.id,
        plan: subscription.plan,
        resolvedVersion: resolveSubscriptionPlanVersion(
          subscription.plan,
          subscription.planVersion,
        ),
      }),
    );
  }
}

export function computePlanCentsFromSubscription(subscription: SubscriptionPlanVersionInput): number {
  if (subscription.plan === "FREE") {
    return 0;
  }
  const version = resolveSubscriptionPlanVersion(subscription.plan, subscription.planVersion);
  return resolvePlanPrice(version);
}
