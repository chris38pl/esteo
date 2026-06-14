import type { SubscriptionPlan } from "@prisma/client";

/**
 * Versioned entitlement catalog. A subscription pins a `(plan, planVersion)` so that
 * pricing/entitlement changes (e.g. PRO_2026 -> PRO_2027) grandfather existing customers
 * instead of silently re-rating them. `getWorkspaceEntitlements` always resolves the pinned
 * version, never a mutable "current PRO".
 */
export type PlanLimits = {
  /** Non-owner seats the workspace may fill. null = unlimited. */
  maxInvitedSeats: number | null;
  /** Estimates per calendar month. null = unlimited. */
  maxEstimatesPerMonth: number | null;
  /** AI assistant calls per calendar month. null = unlimited. */
  maxAiAssistantCallsPerMonth: number | null;
  /** Undo history depth in the editor. */
  maxUndoSteps: number;
  /** Attachment storage budget in bytes. */
  maxStorageBytes: number;
};

const MB = 1024 * 1024;
const GB = 1024 * MB;

/** Current catalog version per plan. Bump when introducing a new pricing/entitlement generation. */
export const DEFAULT_PLAN_VERSION: Record<SubscriptionPlan, string> = {
  FREE: "FREE_2026",
  PRO: "PRO_2026",
  BUSINESS: "BUSINESS_2026",
};

/** Every published version. Old versions stay forever so pinned subscriptions keep resolving. */
export const PLAN_CATALOG: Record<string, PlanLimits> = {
  FREE_2026: {
    maxInvitedSeats: 0,
    maxEstimatesPerMonth: 3,
    maxAiAssistantCallsPerMonth: 10,
    maxUndoSteps: 1,
    maxStorageBytes: 250 * MB,
  },
  PRO_2026: {
    maxInvitedSeats: 0,
    maxEstimatesPerMonth: null,
    maxAiAssistantCallsPerMonth: 100,
    maxUndoSteps: 3,
    maxStorageBytes: 1 * GB,
  },
  BUSINESS_2026: {
    maxInvitedSeats: null,
    maxEstimatesPerMonth: null,
    maxAiAssistantCallsPerMonth: null,
    maxUndoSteps: 3,
    maxStorageBytes: 5 * GB,
  },
};

/**
 * Resolves the pinned entitlement limits for a subscription. Falls back to the plan's current
 * default version when no version is pinned or a pinned version is no longer recognised.
 */
export function resolvePlanLimits(
  plan: SubscriptionPlan,
  planVersion?: string | null,
): PlanLimits {
  const version =
    planVersion && PLAN_CATALOG[planVersion] ? planVersion : DEFAULT_PLAN_VERSION[plan];
  return PLAN_CATALOG[version];
}

/** The default catalog version for a plan (used when creating new subscriptions). */
export function defaultPlanVersion(plan: SubscriptionPlan): string {
  return DEFAULT_PLAN_VERSION[plan];
}
