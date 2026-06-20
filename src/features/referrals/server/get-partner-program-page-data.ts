import "server-only";

import { prisma } from "@/db/client";
import { resolveReferralPayoutStatusKey } from "@/features/referrals/lib/referral-payout-status";
import { getReferralEarningsSummary } from "@/features/referrals/lib/referral-earnings-summary";
import { nextTierProgress } from "@/features/referrals/lib/referral-partner-tier";
import {
  canAccessPartnerProgram,
  canUserGenerateReferrals,
} from "@/features/referrals/server/referral-eligibility";
import { getOrCreateUserReferralProfile } from "@/features/referrals/server/user-referral-profile-service";

export async function getPartnerProgramPageData(params: {
  ownerUserId: string;
  contextWorkspaceId: string;
}) {
  const canGenerate = await canUserGenerateReferrals(params.ownerUserId);
  const canAccess = await canAccessPartnerProgram(params.ownerUserId);

  if (!canAccess && !canGenerate) {
    return null;
  }

  const [profile, summary, referrals, contextWorkspace] = await Promise.all([
    getOrCreateUserReferralProfile(params.ownerUserId),
    getReferralEarningsSummary(params.ownerUserId),
    prisma.referral.findMany({
      where: { referrerUserId: params.ownerUserId },
      orderBy: { createdAt: "desc" },
      include: {
        referredWorkspace: {
          select: {
            name: true,
            slug: true,
            provisioningStatus: true,
            owner: { select: { email: true } },
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
    }),
    prisma.workspace.findUnique({
      where: { id: params.contextWorkspaceId },
      select: {
        billingAccount: {
          select: {
            subscription: {
              select: { plan: true },
            },
          },
        },
      },
    }),
  ]);

  const tierProgress = nextTierProgress(summary.activeReferralCount);

  const rows = referrals.map((referral) => {
    const sub = referral.referredWorkspace.billingAccount?.subscription;
    const hasPaid =
      Boolean(sub?.stripeSubscriptionId) &&
      sub?.plan !== "FREE" &&
      (sub?.status === "ACTIVE" || sub?.status === "TRIAL");

    return {
      id: referral.id,
      referredEmail: referral.referredWorkspace.owner.email,
      workspaceName: referral.referredWorkspace.name,
      workspaceSlug: referral.referredWorkspace.slug,
      status: referral.status,
      attributionSource: referral.attributionSource,
      rewardCents: referral.rewardCents,
      expectedRewardCents: referral.expectedRewardCents,
      rewardGrantedAt: referral.rewardGrantedAt?.toISOString() ?? null,
      activatedAt: referral.activatedAt?.toISOString() ?? null,
      claimedAt: referral.claimedAt.toISOString(),
      payoutStatusKey: resolveReferralPayoutStatusKey(
        referral,
        referral.referredWorkspace.provisioningStatus,
        hasPaid,
      ),
      createdAt: referral.createdAt.toISOString(),
    };
  });

  const currentPlan =
    contextWorkspace?.billingAccount?.subscription?.plan ?? "FREE";

  return {
    profile: {
      code: profile.code,
      email: profile.user.email,
    },
    canGenerateReferrals: canGenerate,
    currentPlan,
    summary,
    tierProgress,
    referrals: rows,
    contextWorkspaceId: params.contextWorkspaceId,
  };
}
