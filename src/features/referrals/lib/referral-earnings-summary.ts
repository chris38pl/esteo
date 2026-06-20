import "server-only";

import { prisma } from "@/db/client";
import { getReferrerStripeBalanceCents } from "@/features/referrals/server/referral-credit-service";
import { getReferralMrrImpact } from "@/features/referrals/server/referral-mrr-sync";
import { resolvePartnerTier } from "@/features/referrals/lib/referral-partner-tier";

export type ReferralEarningsSummary = {
  earnedCents: number;
  paidReferredCount: number;
  appliedCents: number;
  availableBalanceCents: number;
  activeReferralCount: number;
  activeMrrCents: number;
  lifetimeReferralCount: number;
  tier: ReturnType<typeof resolvePartnerTier>;
};

function isPaidReferredSubscription(
  subscription: {
    plan: string;
    status: string;
    stripeSubscriptionId: string | null;
  } | null | undefined,
): boolean {
  return Boolean(
    subscription &&
      subscription.plan !== "FREE" &&
      subscription.stripeSubscriptionId &&
      (subscription.status === "ACTIVE" || subscription.status === "TRIAL"),
  );
}

export async function getReferralEarningsSummary(
  referrerUserId: string,
): Promise<ReferralEarningsSummary> {
  const referrals = await prisma.referral.findMany({
    where: { referrerUserId },
    select: {
      status: true,
      rewardCents: true,
      referredWorkspace: {
        select: {
          billingAccount: {
            select: {
              subscription: {
                select: {
                  plan: true,
                  status: true,
                  stripeSubscriptionId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  let earnedCents = 0;
  let paidReferredCount = 0;

  for (const referral of referrals) {
    if (referral.rewardCents > 0) {
      earnedCents += referral.rewardCents;
    }

    if (isPaidReferredSubscription(referral.referredWorkspace.billingAccount?.subscription)) {
      paidReferredCount += 1;
    }
  }

  const availableBalanceCents = await getReferrerStripeBalanceCents(referrerUserId);
  const appliedCents = Math.max(0, earnedCents - availableBalanceCents);
  const activeReferralCount = referrals.filter((r) => r.status === "ACTIVE").length;
  const activeMrrCents = await getReferralMrrImpact(referrerUserId);

  return {
    earnedCents,
    paidReferredCount,
    appliedCents,
    availableBalanceCents,
    activeReferralCount,
    activeMrrCents,
    lifetimeReferralCount: referrals.length,
    tier: resolvePartnerTier(activeReferralCount),
  };
}
