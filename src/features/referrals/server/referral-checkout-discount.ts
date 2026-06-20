import "server-only";

import { prisma } from "@/db/client";

export type ReferralDiscountIneligibilityReason =
  | "no_referral"
  | "suspicious"
  | "already_paid"
  | "no_coupon_config";

export type ReferralDiscountEligibility = {
  eligible: boolean;
  reason?: ReferralDiscountIneligibilityReason;
};

export function getReferralCouponId(): string | null {
  const couponId = process.env.STRIPE_REFERRAL_COUPON_ID?.trim();
  return couponId || null;
}

export async function workspaceHasPendingReferralClaim(
  workspaceId: string,
): Promise<boolean> {
  const referral = await prisma.referral.findUnique({
    where: { referredWorkspaceId: workspaceId },
    select: { id: true, status: true, fraudFlag: true },
  });
  return Boolean(
    referral &&
      referral.status === "PENDING_CLAIM" &&
      referral.fraudFlag !== "SUSPICIOUS",
  );
}

/** @deprecated Use workspaceHasPendingReferralClaim or getReferralDiscountEligibility */
export async function workspaceHasPendingReferral(workspaceId: string): Promise<boolean> {
  return workspaceHasPendingReferralClaim(workspaceId);
}

export async function getReferralDiscountEligibility(
  workspaceId: string,
): Promise<ReferralDiscountEligibility> {
  const referral = await prisma.referral.findUnique({
    where: { referredWorkspaceId: workspaceId },
    select: { id: true, status: true, fraudFlag: true },
  });

  if (!referral) {
    return { eligible: false, reason: "no_referral" };
  }

  if (referral.fraudFlag === "SUSPICIOUS") {
    return { eligible: false, reason: "suspicious" };
  }

  if (referral.status !== "PENDING_CLAIM") {
    return { eligible: false, reason: "already_paid" };
  }

  if (!getReferralCouponId()) {
    return { eligible: false, reason: "no_coupon_config" };
  }

  return { eligible: true };
}
