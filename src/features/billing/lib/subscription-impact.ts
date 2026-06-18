import type { SubscriptionPlan } from "@prisma/client";

import {
  addonUnitPriceCents,
  resolveCurrentPlanPrice,
} from "@/server/billing/plan-pricing";
import {
  mergePlanLimitsWithAddons,
  resolveAddonDeltas,
  type AddonDeltas,
} from "@/server/billing/addon-catalog";
import { resolvePlanLimits, type PlanLimits } from "@/server/billing/plan-catalog";
import { formatPlanLimitLabels } from "@/features/billing/lib/format-plan-limit-labels";

export type AddonQuantities = {
  storage: number;
  seats: number;
};

export function addonRowsToQuantities(
  rows: Array<{ addonKey: string; quantity: number }>,
): AddonQuantities {
  return {
    storage: rows.find((row) => row.addonKey === "STORAGE")?.quantity ?? 0,
    seats: rows.find((row) => row.addonKey === "SEATS")?.quantity ?? 0,
  };
}

export type RecurringLineItemKind = "plan" | "addon_storage" | "addon_seats";

export type RecurringLineItem = {
  kind: RecurringLineItemKind;
  quantity?: number;
  cents: number;
};

export type AddonImpactRow = {
  key: "storage" | "seats";
  status: "kept" | "removed" | "changed";
  quantityBefore: number;
  quantityAfter: number;
};

export type LimitImpactRow = {
  key: "users" | "storage" | "ai" | "invites";
  beforeLabel: string;
  afterLabel: string;
  direction: "gain" | "loss";
};

export type PlanImpactTiming =
  | { kind: "immediate" }
  | { kind: "scheduled"; effectiveAt: string };

export type PlanImpactSummary = {
  current: { lineItems: RecurringLineItem[]; totalCents: number };
  after: { lineItems: RecurringLineItem[]; totalCents: number };
  recurringDeltaCents: number;
  timing: PlanImpactTiming;
  addonImpacts: AddonImpactRow[];
  limitImpacts: LimitImpactRow[];
};

export function projectAddonQuantitiesAfterPlanChange(
  targetPlan: SubscriptionPlan,
  current: AddonQuantities,
): AddonQuantities {
  return {
    storage: current.storage,
    seats: targetPlan === "BUSINESS" ? current.seats : 0,
  };
}

export function buildRecurringLineItems(
  plan: SubscriptionPlan,
  addons: AddonQuantities,
): RecurringLineItem[] {
  if (plan === "FREE") {
    return [];
  }

  const items: RecurringLineItem[] = [
    { kind: "plan", cents: resolveCurrentPlanPrice(plan) },
  ];

  if (addons.storage > 0) {
    items.push({
      kind: "addon_storage",
      quantity: addons.storage,
      cents: addons.storage * addonUnitPriceCents("STORAGE"),
    });
  }

  if (addons.seats > 0) {
    items.push({
      kind: "addon_seats",
      quantity: addons.seats,
      cents: addons.seats * addonUnitPriceCents("SEATS"),
    });
  }

  return items;
}

export function computeRecurringCents(plan: SubscriptionPlan, addons: AddonQuantities): number {
  const lineItems = buildRecurringLineItems(plan, addons);
  return lineItems.reduce((sum, item) => sum + item.cents, 0);
}

function effectiveLimits(plan: SubscriptionPlan, addons: AddonQuantities): PlanLimits {
  const base = resolvePlanLimits(plan);
  const deltas: AddonDeltas = resolveAddonDeltas(plan, [
    { addonKey: "STORAGE", quantity: addons.storage },
    { addonKey: "SEATS", quantity: addons.seats },
  ]);
  return mergePlanLimitsWithAddons(base, deltas);
}

function compareLimitValues(
  key: LimitImpactRow["key"],
  before: PlanLimits,
  after: PlanLimits,
): number {
  switch (key) {
    case "users": {
      const beforeUsers =
        before.maxInvitedSeats === null ? Number.POSITIVE_INFINITY : before.maxInvitedSeats + 1;
      const afterUsers =
        after.maxInvitedSeats === null ? Number.POSITIVE_INFINITY : after.maxInvitedSeats + 1;
      if (afterUsers > beforeUsers) {
        return 1;
      }
      if (afterUsers < beforeUsers) {
        return -1;
      }
      return 0;
    }
    case "storage": {
      if (after.maxStorageBytes > before.maxStorageBytes) {
        return 1;
      }
      if (after.maxStorageBytes < before.maxStorageBytes) {
        return -1;
      }
      return 0;
    }
    case "ai": {
      const beforeAi = before.maxAiAssistantCallsPerMonth ?? Number.POSITIVE_INFINITY;
      const afterAi = after.maxAiAssistantCallsPerMonth ?? Number.POSITIVE_INFINITY;
      if (afterAi > beforeAi) {
        return 1;
      }
      if (afterAi < beforeAi) {
        return -1;
      }
      return 0;
    }
    case "invites": {
      const beforeInvites = before.maxInvitedSeats ?? Number.POSITIVE_INFINITY;
      const afterInvites = after.maxInvitedSeats ?? Number.POSITIVE_INFINITY;
      if (afterInvites > beforeInvites) {
        return 1;
      }
      if (afterInvites < beforeInvites) {
        return -1;
      }
      return 0;
    }
  }
}

export function splitLimitImpacts(limitImpacts: LimitImpactRow[]): {
  gains: LimitImpactRow[];
  losses: LimitImpactRow[];
} {
  return {
    gains: limitImpacts.filter((row) => row.direction === "gain"),
    losses: limitImpacts.filter((row) => row.direction === "loss"),
  };
}

export function isPlanUpgrade(currentPlan: SubscriptionPlan, targetPlan: SubscriptionPlan): boolean {
  const order: SubscriptionPlan[] = ["FREE", "PRO", "BUSINESS"];
  return order.indexOf(targetPlan) > order.indexOf(currentPlan);
}

export function isPlanDowngrade(
  currentPlan: SubscriptionPlan,
  targetPlan: SubscriptionPlan,
): boolean {
  const order: SubscriptionPlan[] = ["FREE", "PRO", "BUSINESS"];
  return order.indexOf(targetPlan) < order.indexOf(currentPlan);
}

function limitLabel(
  key: LimitImpactRow["key"],
  limits: PlanLimits,
  unlimitedLabel: string,
): string {
  const labels = formatPlanLimitLabels(limits, unlimitedLabel);
  switch (key) {
    case "users":
      return labels.users;
    case "storage":
      return labels.storage;
    case "ai":
      return labels.ai;
    case "invites":
      return labels.invites;
  }
}

export function computeAddonImpacts(
  before: AddonQuantities,
  after: AddonQuantities,
): AddonImpactRow[] {
  const rows: AddonImpactRow[] = [];

  for (const key of ["storage", "seats"] as const) {
    const quantityBefore = before[key];
    const quantityAfter = after[key];

    if (quantityBefore === quantityAfter) {
      if (quantityAfter > 0) {
        rows.push({ key, status: "kept", quantityBefore, quantityAfter });
      }
      continue;
    }

    if (quantityAfter === 0 && quantityBefore > 0) {
      rows.push({ key, status: "removed", quantityBefore, quantityAfter });
      continue;
    }

    rows.push({ key, status: "changed", quantityBefore, quantityAfter });
  }

  return rows;
}

export function computeLimitImpacts(
  beforePlan: SubscriptionPlan,
  afterPlan: SubscriptionPlan,
  beforeAddons: AddonQuantities,
  afterAddons: AddonQuantities,
  unlimitedLabel: string,
): LimitImpactRow[] {
  const before = effectiveLimits(beforePlan, beforeAddons);
  const after = effectiveLimits(afterPlan, afterAddons);
  const keys: LimitImpactRow["key"][] = ["users", "storage", "ai", "invites"];
  const rows: LimitImpactRow[] = [];

  for (const key of keys) {
    const beforeLabel = limitLabel(key, before, unlimitedLabel);
    const afterLabel = limitLabel(key, after, unlimitedLabel);
    if (beforeLabel === afterLabel) {
      continue;
    }

    const direction = compareLimitValues(key, before, after);
    if (direction === 0) {
      continue;
    }

    rows.push({
      key,
      beforeLabel,
      afterLabel,
      direction: direction > 0 ? "gain" : "loss",
    });
  }

  return rows;
}

export function computePlanImpactSummary(params: {
  currentPlan: SubscriptionPlan;
  targetPlan: SubscriptionPlan;
  currentAddons: AddonQuantities;
  targetAddons?: AddonQuantities;
  effectiveAt?: Date | null;
  unlimitedLabel: string;
}): PlanImpactSummary {
  const afterAddons =
    params.targetAddons ??
    projectAddonQuantitiesAfterPlanChange(params.targetPlan, params.currentAddons);
  const currentLineItems = buildRecurringLineItems(params.currentPlan, params.currentAddons);
  const afterLineItems = buildRecurringLineItems(params.targetPlan, afterAddons);
  const currentTotal = currentLineItems.reduce((sum, item) => sum + item.cents, 0);
  const afterTotal = afterLineItems.reduce((sum, item) => sum + item.cents, 0);

  const isDowngrade =
    params.targetPlan !== params.currentPlan &&
    ["FREE", "PRO", "BUSINESS"].indexOf(params.targetPlan) <
      ["FREE", "PRO", "BUSINESS"].indexOf(params.currentPlan);

  const timing: PlanImpactTiming =
    isDowngrade && params.effectiveAt
      ? { kind: "scheduled", effectiveAt: params.effectiveAt.toISOString() }
      : { kind: "immediate" };

  return {
    current: { lineItems: currentLineItems, totalCents: currentTotal },
    after: { lineItems: afterLineItems, totalCents: afterTotal },
    recurringDeltaCents: afterTotal - currentTotal,
    timing,
    addonImpacts: computeAddonImpacts(params.currentAddons, afterAddons),
    limitImpacts: computeLimitImpacts(
      params.currentPlan,
      params.targetPlan,
      params.currentAddons,
      afterAddons,
      params.unlimitedLabel,
    ),
  };
}

export function computeAddonChangeImpactSummary(params: {
  plan: SubscriptionPlan;
  beforeAddons: AddonQuantities;
  afterAddons: AddonQuantities;
}): Pick<PlanImpactSummary, "current" | "after" | "recurringDeltaCents"> {
  const currentLineItems = buildRecurringLineItems(params.plan, params.beforeAddons);
  const afterLineItems = buildRecurringLineItems(params.plan, params.afterAddons);
  const currentTotal = currentLineItems.reduce((sum, item) => sum + item.cents, 0);
  const afterTotal = afterLineItems.reduce((sum, item) => sum + item.cents, 0);

  return {
    current: { lineItems: currentLineItems, totalCents: currentTotal },
    after: { lineItems: afterLineItems, totalCents: afterTotal },
    recurringDeltaCents: afterTotal - currentTotal,
  };
}
