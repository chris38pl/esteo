/**
 * Typed domain vocabularies for billing/entitlements. Keeping these in one place
 * prevents stringly-typed drift across the EntitlementService, UsageService,
 * BillingService and the effective-status resolver.
 */

/**
 * The single authoritative interpretation of "is this workspace usable, and how".
 * Derived by {@link deriveWorkspaceEffectiveStatus}; no subsystem reads Subscription.status directly.
 */
export type WorkspaceEffectiveStatus =
  | "INCOMPLETE"
  | "ACTIVE"
  | "PAST_DUE"
  | "GRACE_PERIOD"
  | "EXPIRED"
  | "ARCHIVED"
  | "SUSPENDED"
  | "PENDING_DELETION";

/** Metered/gated product capabilities. */
export type Feature =
  | "ESTIMATES"
  | "AI_ASSISTANT"
  | "PDF"
  | "INVITES"
  | "STORAGE"
  | "CLIENT_PORTAL";

/** How a feature behaves for a given workspace state. */
export type FeatureState = "ACTIVE" | "READ_ONLY" | "DISABLED";

/** Discrete mutating actions guarded by entitlements (distinct from RBAC). */
export type EntitlementAction =
  | "create_workspace"
  | "create_free_workspace"
  | "invite_member"
  | "accept_invitation"
  | "create_estimate"
  | "use_ai_assistant"
  | "upload_attachment";

/** Machine-readable reason a guard denied an action — drives UI messaging/CTAs. */
export type EntitlementReason =
  | "PLAN_LIMIT"
  | "SEAT_LIMIT"
  | "STORAGE_LIMIT"
  | "FEATURE_DISABLED"
  | "READ_ONLY_EXPIRED"
  | "FREE_SLOT_TAKEN"
  | "INCOMPLETE"
  | "ARCHIVED"
  | "SUSPENDED";

/**
 * States in which a workspace is fully read-only: existing data is viewable/exportable
 * but no new mutations/creations are allowed.
 */
export const READ_ONLY_EFFECTIVE_STATUSES: ReadonlySet<WorkspaceEffectiveStatus> = new Set([
  "EXPIRED",
  "ARCHIVED",
  "SUSPENDED",
  "PENDING_DELETION",
  "INCOMPLETE",
]);

/** States in which expansion (new estimates/jobs/invites/AI) is blocked but reads still work. */
export const EXPANSION_BLOCKED_EFFECTIVE_STATUSES: ReadonlySet<WorkspaceEffectiveStatus> = new Set([
  ...READ_ONLY_EFFECTIVE_STATUSES,
  "GRACE_PERIOD",
]);

export function isReadOnlyStatus(status: WorkspaceEffectiveStatus): boolean {
  return READ_ONLY_EFFECTIVE_STATUSES.has(status);
}

export function isExpansionBlocked(status: WorkspaceEffectiveStatus): boolean {
  return EXPANSION_BLOCKED_EFFECTIVE_STATUSES.has(status);
}
