import type { Referral, WorkspaceProvisioningStatus } from "@prisma/client";

export type ReferralPayoutStatusKey =
  | "awaiting_registration"
  | "awaiting_first_payment"
  | "awaiting_plan_selection"
  | "processing_bonus"
  | "bonus_granted"
  | "inactive";

export function resolveReferralPayoutStatusKey(
  referral: Pick<
    Referral,
    "status" | "rewardStatus" | "referredPlan" | "expectedRewardCents"
  >,
  provisioningStatus: WorkspaceProvisioningStatus,
  hasPaidSubscription: boolean,
): ReferralPayoutStatusKey {
  if (referral.status === "INACTIVE" || referral.status === "REVOKED") {
    return "inactive";
  }

  if (referral.status === "ACTIVE") {
    if (referral.rewardStatus === "GRANTED") {
      return "bonus_granted";
    }
    if (referral.rewardStatus === "PENDING" || referral.rewardStatus === "FAILED") {
      return "processing_bonus";
    }
  }

  if (referral.status === "PENDING_CLAIM" && provisioningStatus === "INCOMPLETE") {
    return "awaiting_registration";
  }

  if (
    referral.status === "PENDING_CLAIM" &&
    !hasPaidSubscription &&
    (referral.referredPlan == null || referral.referredPlan === "FREE") &&
    referral.expectedRewardCents == null
  ) {
    return "awaiting_plan_selection";
  }

  if (referral.status === "PENDING_CLAIM" && hasPaidSubscription) {
    return "processing_bonus";
  }

  if (referral.status === "PENDING_CLAIM" && !hasPaidSubscription) {
    return "awaiting_first_payment";
  }

  if (referral.status === "PENDING_CLAIM") {
    return "awaiting_first_payment";
  }

  return "inactive";
}
