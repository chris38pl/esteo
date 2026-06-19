import "server-only";

import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

import { prisma } from "@/db/client";

const PAID_PLANS = new Set<SubscriptionPlan>(["PRO", "BUSINESS"]);
const ACTIVE_PAID_STATUSES = new Set<SubscriptionStatus>(["ACTIVE", "TRIAL"]);

export async function canUserGenerateReferrals(userId: string): Promise<boolean> {
  const owned = await prisma.workspace.findMany({
    where: { ownerId: userId, deletedAt: null },
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

  return owned.some((ws) => {
    const sub = ws.billingAccount?.subscription;
    if (!sub) {
      return false;
    }
    return (
      PAID_PLANS.has(sub.plan) &&
      ACTIVE_PAID_STATUSES.has(sub.status) &&
      Boolean(sub.stripeSubscriptionId)
    );
  });
}

export async function canAccessPartnerProgram(userId: string): Promise<boolean> {
  const [profile, referralCount] = await Promise.all([
    prisma.userReferralProfile.findUnique({ where: { userId }, select: { id: true } }),
    prisma.referral.count({ where: { referrerUserId: userId } }),
  ]);
  return Boolean(profile) || referralCount > 0;
}

export async function countOwnedWorkspaces(userId: string): Promise<number> {
  return prisma.workspace.count({
    where: { ownerId: userId, deletedAt: null },
  });
}
