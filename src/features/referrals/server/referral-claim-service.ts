import "server-only";

import type { ReferralAttributionSource, SubscriptionPlan } from "@prisma/client";

import { prisma } from "@/db/client";
import { expectedRewardForPlan } from "@/features/referrals/server/referral-rewards-catalog";
import {
  canUserGenerateReferrals,
} from "@/features/referrals/server/referral-eligibility";
import {
  detectReferralFraud,
  pickAttributionCandidate,
  type AttributionCandidate,
} from "@/features/referrals/server/referral-fraud-detector";
import {
  normalizeReferralCodeInput,
  resolveReferrerByCode,
  resolveReferrerByEmail,
} from "@/features/referrals/server/user-referral-profile-service";

import { isWithinClaimWindow, CLAIM_WINDOW_DAYS } from "@/features/referrals/lib/referral-claim-window";

export class ReferralClaimError extends Error {
  constructor(
    message: string,
    readonly code:
      | "SELF_REFERRAL"
      | "ALREADY_CLAIMED"
      | "WINDOW_CLOSED"
      | "PARTNER_INACTIVE"
      | "NOT_FOUND"
      | "FRAUD",
  ) {
    super(message);
    this.name = "ReferralClaimError";
  }
}

async function workspaceHasPaidSubscription(workspaceId: string): Promise<boolean> {
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
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
  });
  const sub = ws?.billingAccount?.subscription;
  if (!sub?.stripeSubscriptionId) {
    return false;
  }
  return (
    sub.plan !== "FREE" &&
    (sub.status === "ACTIVE" || sub.status === "TRIAL")
  );
}

export async function claimReferralForWorkspace(params: {
  referredWorkspaceId: string;
  referredOwnerId: string;
  referrerContextWorkspaceId?: string | null;
  linkCode?: string | null;
  emailOrCode?: string | null;
  claimIpAddress?: string | null;
  expectedPlan?: SubscriptionPlan | null;
}): Promise<{ referralId: string } | null> {
  const existing = await prisma.referral.findUnique({
    where: { referredWorkspaceId: params.referredWorkspaceId },
    select: { id: true },
  });
  if (existing) {
    throw new ReferralClaimError("Referral already claimed for this workspace.", "ALREADY_CLAIMED");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: params.referredWorkspaceId },
    select: { createdAt: true, ownerId: true },
  });
  if (!workspace || workspace.ownerId !== params.referredOwnerId) {
    throw new ReferralClaimError("Workspace not found.", "NOT_FOUND");
  }

  const hasPaid = await workspaceHasPaidSubscription(params.referredWorkspaceId);
  if (!isWithinClaimWindow(workspace.createdAt, hasPaid)) {
    throw new ReferralClaimError("Referral claim window has closed.", "WINDOW_CLOSED");
  }

  const candidates: AttributionCandidate[] = [];

  if (params.linkCode) {
    const profile = await resolveReferrerByCode(params.linkCode);
    if (profile) {
      candidates.push({
        source: "LINK",
        referrerUserId: profile.userId,
        codeUsed: profile.code,
      });
    }
  }

  const input = params.emailOrCode?.trim();
  if (input) {
    if (input.includes("@")) {
      const resolved = await resolveReferrerByEmail(input);
      if (resolved) {
        candidates.push({
          source: "EMAIL",
          referrerUserId: resolved.user.id,
          referrerEmailUsed: resolved.user.email,
          codeUsed: resolved.profile.code,
        });
      }
    } else {
      const profile = await resolveReferrerByCode(input);
      if (profile) {
        candidates.push({
          source: "CODE",
          referrerUserId: profile.userId,
          codeUsed: profile.code,
        });
      }
    }
  }

  const picked = pickAttributionCandidate(candidates);
  if (!picked) {
    return null;
  }

  if (picked.referrerUserId === params.referredOwnerId) {
    throw new ReferralClaimError("Self-referral is not allowed.", "SELF_REFERRAL");
  }

  const canGenerate = await canUserGenerateReferrals(picked.referrerUserId);
  if (!canGenerate) {
    throw new ReferralClaimError(
      "This partner is not accepting new referrals.",
      "PARTNER_INACTIVE",
    );
  }

  const [referrerUser, referredUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: picked.referrerUserId },
      select: { email: true },
    }),
    prisma.user.findUnique({
      where: { id: params.referredOwnerId },
      select: { email: true },
    }),
  ]);

  if (!referrerUser || !referredUser) {
    throw new ReferralClaimError("User not found.", "NOT_FOUND");
  }

  const fraud = detectReferralFraud({
    referrerUserId: picked.referrerUserId,
    referredOwnerId: params.referredOwnerId,
    referrerEmail: referrerUser.email,
    referredEmail: referredUser.email,
    claimIpAddress: params.claimIpAddress,
  });

  if (fraud.fraudFlag === "SUSPICIOUS" && fraud.fraudReason === "self_referral") {
    throw new ReferralClaimError("Self-referral is not allowed.", "FRAUD");
  }

  const plan = params.expectedPlan ?? null;
  const expectedRewardCents = plan ? expectedRewardForPlan(plan) : null;

  const referral = await prisma.referral.create({
    data: {
      referrerUserId: picked.referrerUserId,
      referredWorkspaceId: params.referredWorkspaceId,
      referredOwnerId: params.referredOwnerId,
      referrerContextWorkspaceId: params.referrerContextWorkspaceId ?? null,
      attributionSource: picked.source,
      codeUsed: picked.codeUsed ?? null,
      referrerEmailUsed: picked.referrerEmailUsed ?? null,
      expectedRewardCents,
      fraudFlag: fraud.fraudFlag,
      fraudReason: fraud.fraudReason,
      claimIpAddress: params.claimIpAddress ?? null,
      referrerEmailDomain: fraud.referrerEmailDomain,
      referredEmailDomain: fraud.referredEmailDomain,
    },
  });

  return { referralId: referral.id };
}

export async function updateReferralExpectedPlan(
  referredWorkspaceId: string,
  plan: SubscriptionPlan,
): Promise<void> {
  const referral = await prisma.referral.findUnique({
    where: { referredWorkspaceId },
    select: { id: true, status: true, rewardGrantedAt: true },
  });
  if (!referral || referral.status !== "PENDING_CLAIM" || referral.rewardGrantedAt) {
    return;
  }

  await prisma.referral.update({
    where: { id: referral.id },
    data: {
      referredPlan: plan,
      expectedRewardCents: expectedRewardForPlan(plan),
    },
  });
}

export async function getReferralForWorkspace(referredWorkspaceId: string) {
  return prisma.referral.findUnique({
    where: { referredWorkspaceId },
  });
}

export { normalizeReferralCodeInput, CLAIM_WINDOW_DAYS };
export { isWithinClaimWindow } from "@/features/referrals/lib/referral-claim-window";
