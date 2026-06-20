import type { ReferralRewardStatus } from "@prisma/client";

export type ReferralKpiRow = {
  status: string;
  rewardCents: number;
  rewardStatus: ReferralRewardStatus | null;
};

export type ReferralKpiTotals = {
  grantedRewardsCents: number;
  processingBalanceCents: number;
  referredCompaniesCount: number;
  activeReferralCount: number;
};

export function computeReferralKpiFromRows(referrals: ReferralKpiRow[]): ReferralKpiTotals {
  let grantedRewardsCents = 0;
  let processingBalanceCents = 0;
  let referredCompaniesCount = 0;

  for (const referral of referrals) {
    if (referral.status === "ACTIVE") {
      referredCompaniesCount += 1;
    }

    if (referral.rewardStatus === "GRANTED") {
      grantedRewardsCents += referral.rewardCents;
    } else if (referral.rewardStatus === "PENDING" || referral.rewardStatus === "FAILED") {
      processingBalanceCents += referral.rewardCents;
    }
  }

  return {
    grantedRewardsCents,
    processingBalanceCents,
    referredCompaniesCount,
    activeReferralCount: referredCompaniesCount,
  };
}

export function computeUsedReferralBalanceCents(
  grantedRewardsCents: number,
  availableBalanceCents: number,
): number {
  return Math.max(0, grantedRewardsCents - availableBalanceCents);
}
