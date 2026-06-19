import "server-only";

import { prisma } from "@/db/client";

export function getReferralCouponId(): string | null {
  const couponId = process.env.STRIPE_REFERRAL_COUPON_ID?.trim();
  return couponId || null;
}

export async function workspaceHasPendingReferral(workspaceId: string): Promise<boolean> {
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
