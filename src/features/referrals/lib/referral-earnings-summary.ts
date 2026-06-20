import "server-only";

import { prisma } from "@/db/client";
import { getReferrerStripeBalanceCents } from "@/features/referrals/server/referral-credit-service";
import { getReferralMrrImpact } from "@/features/referrals/server/referral-mrr-sync";
import { resolvePartnerTier } from "@/features/referrals/lib/referral-partner-tier";
import {
  computeReferralKpiFromRows,
  computeUsedReferralBalanceCents,
} from "@/features/referrals/lib/referral-kpi-utils";

export type ReferralEarningsSummary = {
  grantedRewardsCents: number;
  processingBalanceCents: number;
  usedBalanceCents: number;
  availableBalanceCents: number;
  referredCompaniesCount: number;
  paidReferredCount: number;
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
      rewardStatus: true,
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

  let paidReferredCount = 0;

  for (const referral of referrals) {
    if (isPaidReferredSubscription(referral.referredWorkspace.billingAccount?.subscription)) {
      paidReferredCount += 1;
    }
  }

  const kpi = computeReferralKpiFromRows(referrals);
  const availableBalanceCents = await getReferrerStripeBalanceCents(referrerUserId);
  const usedBalanceCents = computeUsedReferralBalanceCents(
    kpi.grantedRewardsCents,
    availableBalanceCents,
  );
  const activeMrrCents = await getReferralMrrImpact(referrerUserId);

  return {
    ...kpi,
    usedBalanceCents,
    paidReferredCount,
    availableBalanceCents,
    activeMrrCents,
    lifetimeReferralCount: referrals.length,
    tier: resolvePartnerTier(kpi.activeReferralCount),
  };
}
