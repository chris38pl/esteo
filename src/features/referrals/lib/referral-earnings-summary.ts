import "server-only";

import { prisma } from "@/db/client";
import { getReferrerStripeBalanceCents } from "@/features/referrals/server/referral-credit-service";
import { getReferralMrrImpact } from "@/features/referrals/server/referral-mrr-sync";
import { resolvePartnerTier } from "@/features/referrals/lib/referral-partner-tier";

export type ReferralEarningsSummary = {
  earnedCents: number;
  pendingCents: number;
  appliedCents: number;
  availableBalanceCents: number;
  activeReferralCount: number;
  activeMrrCents: number;
  lifetimeReferralCount: number;
  tier: ReturnType<typeof resolvePartnerTier>;
};

export async function getReferralEarningsSummary(
  referrerUserId: string,
): Promise<ReferralEarningsSummary> {
  const referrals = await prisma.referral.findMany({
    where: { referrerUserId },
    select: {
      status: true,
      rewardCents: true,
      expectedRewardCents: true,
    },
  });

  let earnedCents = 0;
  let pendingCents = 0;

  for (const referral of referrals) {
    if (referral.rewardCents > 0) {
      earnedCents += referral.rewardCents;
    } else if (
      referral.status === "PENDING_CLAIM" &&
      referral.expectedRewardCents != null
    ) {
      pendingCents += referral.expectedRewardCents;
    }
  }

  const availableBalanceCents = await getReferrerStripeBalanceCents(referrerUserId);
  const appliedCents = Math.max(0, earnedCents - availableBalanceCents);
  const activeReferralCount = referrals.filter((r) => r.status === "ACTIVE").length;
  const activeMrrCents = await getReferralMrrImpact(referrerUserId);

  return {
    earnedCents,
    pendingCents,
    appliedCents,
    availableBalanceCents,
    activeReferralCount,
    activeMrrCents,
    lifetimeReferralCount: referrals.length,
    tier: resolvePartnerTier(activeReferralCount),
  };
}
