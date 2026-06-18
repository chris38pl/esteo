import { subDays } from "date-fns";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export type BillingOwnershipState = "NORMAL" | "HANDOFF_ACTIVE" | "HANDOFF_EXPIRED";

export type WorkspaceBillingPermissions = {
  canViewBilling: boolean;
  canManageBilling: boolean;
  canChangePlanOrAddons: boolean;
  canPurchaseSubscription: boolean;
  canResumeSubscription: boolean;
  billingHandoffActive: boolean;
  billingOwnershipState: BillingOwnershipState;
  activeBillingPayerId: string | null;
  payerUserId: string;
  ownerId: string;
  isBillingPayer: boolean;
};

export type BillingPayerWorkspace = {
  id: string;
  name: string;
  slug: string;
};

const ACTIVE_PAID_STATUSES = new Set<SubscriptionStatus>(["ACTIVE", "TRIAL"]);

export function resolveEffectivePayerUserId(
  payerUserId: string | null | undefined,
  workspaceOwnerId: string,
): string {
  return payerUserId ?? workspaceOwnerId;
}

export function isHandoffTimedOut(
  handoffExpiredAt: Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!handoffExpiredAt) {
    return false;
  }
  return handoffExpiredAt < subDays(now, 90);
}

function isPaidActiveSubscription(input: {
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: SubscriptionPlan;
  stripeSubscriptionId: string | null;
}): boolean {
  return (
    Boolean(input.stripeSubscriptionId) &&
    input.subscriptionPlan !== "FREE" &&
    ACTIVE_PAID_STATUSES.has(input.subscriptionStatus)
  );
}

function isExpiredOrNoSubscription(input: {
  subscriptionStatus: SubscriptionStatus;
  stripeSubscriptionId: string | null;
}): boolean {
  return (
    !input.stripeSubscriptionId ||
    input.subscriptionStatus === "EXPIRED" ||
    input.subscriptionStatus === "CANCELED"
  );
}

/**
 * Canonical derived billing lifecycle state (not stored in DB).
 *
 * `NORMAL` has two descriptive variants (same enum value):
 * - NORMAL (owner-managed): owner === payer, active billing
 * - NORMAL (free / no active payer): FREE or post-90d timeout — owner !== payer may still be true
 */
export function deriveBillingOwnershipState(input: {
  ownerUserId: string;
  payerUserId: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: SubscriptionPlan;
  handoffExpiredAt?: Date | null;
  stripeSubscriptionId?: string | null;
  now?: Date;
}): BillingOwnershipState {
  const now = input.now ?? new Date();
  const handoffExpiredAt = input.handoffExpiredAt ?? null;
  const stripeSubscriptionId = input.stripeSubscriptionId ?? null;

  if (input.ownerUserId === input.payerUserId) {
    return "NORMAL";
  }

  if (isHandoffTimedOut(handoffExpiredAt, now)) {
    return "NORMAL";
  }

  if (
    isPaidActiveSubscription({
      subscriptionStatus: input.subscriptionStatus,
      subscriptionPlan: input.subscriptionPlan,
      stripeSubscriptionId,
    })
  ) {
    return "HANDOFF_ACTIVE";
  }

  if (
    isExpiredOrNoSubscription({
      subscriptionStatus: input.subscriptionStatus,
      stripeSubscriptionId,
    })
  ) {
    return "HANDOFF_EXPIRED";
  }

  return "NORMAL";
}

export function deriveActiveBillingPayerId(input: {
  billingOwnershipState: BillingOwnershipState;
  ownerUserId: string;
  payerUserId: string;
}): string | null {
  switch (input.billingOwnershipState) {
    case "HANDOFF_ACTIVE":
      return input.payerUserId;
    case "HANDOFF_EXPIRED":
      return null;
    case "NORMAL":
      return input.ownerUserId === input.payerUserId ? input.ownerUserId : null;
    default:
      return null;
  }
}

/** Pure evaluation — used by server helpers and verify script. */
export function evaluateWorkspaceBillingPermissions(input: {
  userId: string;
  workspaceOwnerId: string;
  payerUserId: string;
  isActiveMember: boolean;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: SubscriptionPlan;
  handoffExpiredAt?: Date | null;
  stripeSubscriptionId?: string | null;
  now?: Date;
}): WorkspaceBillingPermissions {
  const billingOwnershipState = deriveBillingOwnershipState({
    ownerUserId: input.workspaceOwnerId,
    payerUserId: input.payerUserId,
    subscriptionStatus: input.subscriptionStatus,
    subscriptionPlan: input.subscriptionPlan,
    handoffExpiredAt: input.handoffExpiredAt,
    stripeSubscriptionId: input.stripeSubscriptionId,
    now: input.now,
  });

  const activeBillingPayerId = deriveActiveBillingPayerId({
    billingOwnershipState,
    ownerUserId: input.workspaceOwnerId,
    payerUserId: input.payerUserId,
  });

  const isBillingPayer =
    activeBillingPayerId !== null && input.userId === activeBillingPayerId;
  const isOwnerMember =
    input.workspaceOwnerId === input.userId && input.isActiveMember;

  const isHistoricalPayerOnly =
    input.userId === input.payerUserId && !isBillingPayer;

  if (isHistoricalPayerOnly) {
    return {
      canViewBilling: false,
      canManageBilling: false,
      canChangePlanOrAddons: false,
      canPurchaseSubscription: false,
      canResumeSubscription: false,
      billingHandoffActive:
        billingOwnershipState === "HANDOFF_ACTIVE" ||
        billingOwnershipState === "HANDOFF_EXPIRED",
      billingOwnershipState,
      activeBillingPayerId,
      payerUserId: input.payerUserId,
      ownerId: input.workspaceOwnerId,
      isBillingPayer: false,
    };
  }

  const billingHandoffActive =
    billingOwnershipState === "HANDOFF_ACTIVE" ||
    billingOwnershipState === "HANDOFF_EXPIRED";

  let canViewBilling = false;
  let canManageBilling = false;
  let canChangePlanOrAddons = false;
  let canPurchaseSubscription = false;
  let canResumeSubscription = false;

  switch (billingOwnershipState) {
    case "HANDOFF_ACTIVE":
      canViewBilling = isBillingPayer || isOwnerMember;
      canManageBilling = isBillingPayer;
      canChangePlanOrAddons = false;
      canPurchaseSubscription = false;
      canResumeSubscription = false;
      break;
    case "HANDOFF_EXPIRED":
      canViewBilling = isOwnerMember;
      canManageBilling = isOwnerMember;
      canChangePlanOrAddons = false;
      canPurchaseSubscription = isOwnerMember;
      canResumeSubscription = false;
      break;
    case "NORMAL":
    default:
      canViewBilling = isBillingPayer || isOwnerMember;
      if (activeBillingPayerId) {
        canManageBilling = isBillingPayer;
        canChangePlanOrAddons = isBillingPayer;
        canResumeSubscription = isBillingPayer;
      } else {
        canManageBilling = isOwnerMember;
        canChangePlanOrAddons = isOwnerMember;
        canResumeSubscription = isOwnerMember;
      }
      canPurchaseSubscription =
        isOwnerMember &&
        input.subscriptionPlan === "FREE" &&
        !input.stripeSubscriptionId;
      break;
  }

  return {
    canViewBilling,
    canManageBilling,
    canChangePlanOrAddons,
    canPurchaseSubscription,
    canResumeSubscription,
    billingHandoffActive,
    billingOwnershipState,
    activeBillingPayerId,
    payerUserId: input.payerUserId,
    ownerId: input.workspaceOwnerId,
    isBillingPayer,
  };
}
