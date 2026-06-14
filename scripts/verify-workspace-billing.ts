import type { Stripe } from "stripe";

import { deriveWorkspaceEffectiveStatus } from "../src/server/billing/effective-status";
import type { WorkspaceStatusInput } from "../src/server/billing/effective-status";
import { deriveFeatureState } from "../src/server/billing/entitlement-service";
import {
  DEFAULT_PLAN_VERSION,
  defaultPlanVersion,
  resolvePlanLimits,
} from "../src/server/billing/plan-catalog";
import { isSeatOverLimit } from "../src/server/billing/seat-overage";
import {
  mapStripeStatus,
} from "../src/features/billing/server/subscription-sync";
import {
  extractStripePriceId,
  resolvePlanFromStripeSubscription,
} from "../src/features/billing/server/stripe-plan-utils";
import { BillingPlanResolutionError } from "../src/features/billing/server/billing-errors";
import { FREE_WORKSPACE_COOLDOWN_DAYS } from "../src/server/permissions/entitlements";

let failures = 0;
let checks = 0;

function assert(condition: boolean, message: string): void {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`  ✗ ${message}`);
  }
}

const NOW = new Date("2026-06-14T00:00:00.000Z");
const PAST = new Date("2026-06-01T00:00:00.000Z");
const FUTURE = new Date("2026-07-01T00:00:00.000Z");

function status(overrides: Partial<WorkspaceStatusInput> = {}): WorkspaceStatusInput {
  return {
    deletedAt: null,
    archivedAt: null,
    platformSuspendedAt: null,
    provisioningStatus: "ACTIVE",
    subscriptionStatus: "ACTIVE",
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    graceEndsAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Effective-status precedence + lifecycle transitions
// ---------------------------------------------------------------------------
console.log("Effective status derivation:");

assert(
  deriveWorkspaceEffectiveStatus(status({ deletedAt: PAST }), NOW) === "PENDING_DELETION",
  "soft-deleted workspace is PENDING_DELETION",
);
assert(
  deriveWorkspaceEffectiveStatus(
    status({ platformSuspendedAt: PAST, archivedAt: PAST }),
    NOW,
  ) === "SUSPENDED",
  "platform suspension outranks archive",
);
assert(
  deriveWorkspaceEffectiveStatus(status({ archivedAt: PAST }), NOW) === "ARCHIVED",
  "archived workspace is ARCHIVED",
);
assert(
  deriveWorkspaceEffectiveStatus(
    status({ provisioningStatus: "INCOMPLETE", subscriptionStatus: "INACTIVE" }),
    NOW,
  ) === "INCOMPLETE",
  "incomplete provisioning outranks billing lifecycle",
);
assert(
  deriveWorkspaceEffectiveStatus(status({ subscriptionStatus: null }), NOW) === "ACTIVE",
  "no subscription (free) is ACTIVE",
);
assert(
  deriveWorkspaceEffectiveStatus(status({ subscriptionStatus: "TRIAL" }), NOW) === "ACTIVE",
  "trialing is ACTIVE",
);
assert(
  deriveWorkspaceEffectiveStatus(status({ subscriptionStatus: "PAST_DUE" }), NOW) === "PAST_DUE",
  "past_due is PAST_DUE (still usable)",
);
assert(
  deriveWorkspaceEffectiveStatus(
    status({ subscriptionStatus: "GRACE_PERIOD", graceEndsAt: FUTURE }),
    NOW,
  ) === "GRACE_PERIOD",
  "grace with future end is GRACE_PERIOD",
);
assert(
  deriveWorkspaceEffectiveStatus(
    status({ subscriptionStatus: "GRACE_PERIOD", graceEndsAt: PAST }),
    NOW,
  ) === "EXPIRED",
  "grace past its end expires",
);
assert(
  deriveWorkspaceEffectiveStatus(
    status({ subscriptionStatus: "CANCELED", cancelAtPeriodEnd: true, currentPeriodEnd: FUTURE }),
    NOW,
  ) === "ACTIVE",
  "cancel-at-period-end stays ACTIVE until period end",
);
assert(
  deriveWorkspaceEffectiveStatus(
    status({ subscriptionStatus: "CANCELED", cancelAtPeriodEnd: true, currentPeriodEnd: PAST }),
    NOW,
  ) === "EXPIRED",
  "cancel-at-period-end expires after period end",
);
assert(
  deriveWorkspaceEffectiveStatus(status({ subscriptionStatus: "EXPIRED" }), NOW) === "EXPIRED",
  "expired subscription is EXPIRED",
);

// ---------------------------------------------------------------------------
// Feature degradation across lifecycle states
// ---------------------------------------------------------------------------
console.log("Feature degradation:");

const free = resolvePlanLimits("FREE");
const pro = resolvePlanLimits("PRO");

assert(
  deriveFeatureState("ACTIVE", "PRO", pro, "ESTIMATES") === "ACTIVE",
  "ACTIVE PRO can create estimates",
);
assert(
  deriveFeatureState("SUSPENDED", "PRO", pro, "ESTIMATES") === "DISABLED",
  "SUSPENDED disables all features",
);
assert(
  deriveFeatureState("PENDING_DELETION", "PRO", pro, "AI_ASSISTANT") === "DISABLED",
  "PENDING_DELETION disables all features",
);
assert(
  deriveFeatureState("EXPIRED", "PRO", pro, "ESTIMATES") === "READ_ONLY",
  "EXPIRED is read-only",
);
assert(
  deriveFeatureState("ARCHIVED", "PRO", pro, "ESTIMATES") === "READ_ONLY",
  "ARCHIVED is read-only",
);
assert(
  deriveFeatureState("INCOMPLETE", "PRO", pro, "ESTIMATES") === "READ_ONLY",
  "INCOMPLETE is read-only",
);
assert(
  deriveFeatureState("GRACE_PERIOD", "PRO", pro, "ESTIMATES") === "READ_ONLY",
  "GRACE blocks estimate creation",
);
assert(
  deriveFeatureState("GRACE_PERIOD", "PRO", pro, "INVITES") === "READ_ONLY",
  "GRACE blocks invites",
);
assert(
  deriveFeatureState("GRACE_PERIOD", "PRO", pro, "CLIENT_PORTAL") === "ACTIVE",
  "GRACE keeps portal/reads live",
);
assert(
  deriveFeatureState("ACTIVE", "FREE", free, "INVITES") === "DISABLED",
  "FREE has no invite seats",
);
assert(
  deriveFeatureState("ACTIVE", "FREE", free, "CLIENT_PORTAL") === "DISABLED",
  "FREE has no client portal",
);
assert(
  deriveFeatureState("PAST_DUE", "PRO", pro, "ESTIMATES") === "ACTIVE",
  "PAST_DUE keeps full access",
);

// ---------------------------------------------------------------------------
// Plan catalog
// ---------------------------------------------------------------------------
console.log("Plan catalog:");

assert(defaultPlanVersion("PRO") === DEFAULT_PLAN_VERSION.PRO, "defaultPlanVersion(PRO) matches catalog");
assert(resolvePlanLimits("FREE").maxInvitedSeats === 0, "FREE has 0 invited seats");
assert(resolvePlanLimits("PRO").maxInvitedSeats === 3, "PRO has 3 invited seats");
assert(resolvePlanLimits("BUSINESS").maxInvitedSeats === null, "BUSINESS has unlimited seats");
assert(resolvePlanLimits("FREE").maxEstimatesPerMonth === 3, "FREE caps estimates at 3");
assert(resolvePlanLimits("PRO").maxEstimatesPerMonth === null, "PRO has unlimited estimates");
assert(
  resolvePlanLimits("PRO", "NONEXISTENT_VERSION").maxAiAssistantCallsPerMonth === 100,
  "unknown pinned version falls back to current default",
);

// ---------------------------------------------------------------------------
// Webhook status + plan routing
// ---------------------------------------------------------------------------
console.log("Webhook routing:");

assert(mapStripeStatus("active") === "ACTIVE", "stripe active -> ACTIVE");
assert(mapStripeStatus("trialing") === "TRIAL", "stripe trialing -> TRIAL");
assert(mapStripeStatus("past_due") === "PAST_DUE", "stripe past_due -> PAST_DUE");
assert(mapStripeStatus("unpaid") === "PAST_DUE", "stripe unpaid -> PAST_DUE");
assert(mapStripeStatus("paused") === "GRACE_PERIOD", "stripe paused -> GRACE_PERIOD");
assert(mapStripeStatus("canceled") === "CANCELED", "stripe canceled -> CANCELED");
assert(mapStripeStatus("incomplete") === "INACTIVE", "stripe incomplete -> INACTIVE");

function subWith(metadataPlan?: string, priceId = "price_unmapped"): Stripe.Subscription {
  return {
    id: "sub_test",
    items: { data: [{ price: { id: priceId } }] },
    metadata: metadataPlan ? { plan: metadataPlan } : {},
  } as unknown as Stripe.Subscription;
}

assert(
  resolvePlanFromStripeSubscription(subWith("BUSINESS")) === "BUSINESS",
  "metadata.plan=BUSINESS resolves to BUSINESS",
);

assert(
  resolvePlanFromStripeSubscription(subWith("BUSINESS"), { planHint: "BUSINESS" }) === "BUSINESS",
  "planHint=BUSINESS resolves to BUSINESS",
);

let threwOnUnknownPlan = false;
try {
  resolvePlanFromStripeSubscription(subWith());
} catch (error) {
  threwOnUnknownPlan = error instanceof BillingPlanResolutionError;
}
assert(threwOnUnknownPlan, "unknown price + no metadata throws BillingPlanResolutionError");

assert(
  extractStripePriceId({
    price: "price_string_id",
  } as unknown as Stripe.SubscriptionItem) === "price_string_id",
  "extractStripePriceId handles string price",
);

// ---------------------------------------------------------------------------
// Seat overage + FREE cooldown constants
// ---------------------------------------------------------------------------
console.log("Seat overage + policy constants:");

assert(
  isSeatOverLimit({ seatLimit: 3, used: 2, reserved: 2 }) === true,
  "seat overage when used+reserved exceeds limit",
);
assert(
  isSeatOverLimit({ seatLimit: 3, used: 2, reserved: 1 }) === false,
  "no seat overage when within limit",
);
assert(
  isSeatOverLimit({ seatLimit: null, used: 99, reserved: 99 }) === false,
  "unlimited seats never over limit",
);
assert(FREE_WORKSPACE_COOLDOWN_DAYS === 30, "FREE workspace cooldown is 30 days");

// ---------------------------------------------------------------------------
console.log("");
if (failures > 0) {
  console.error(`workspace-billing checks: ${checks - failures}/${checks} passed, ${failures} FAILED`);
  process.exit(1);
}
console.log(`workspace-billing checks: all ${checks} passed.`);
