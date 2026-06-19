import "server-only";

import type { SubscriptionPlan } from "@prisma/client";

import { prisma } from "@/db/client";
import {
  computePlanCentsFromSubscription,
  computeAddonMonthlyCents,
} from "@/server/billing/plan-pricing";

export async function monthlyRevenueForWorkspace(workspaceId: string): Promise<number> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      billingAccount: {
        select: {
          subscription: {
            select: { id: true, plan: true, planVersion: true, status: true },
          },
        },
      },
      workspaceAddons: {
        where: { status: "ACTIVE" },
        select: { addonKey: true, quantity: true },
      },
    },
  });

  const sub = workspace?.billingAccount?.subscription;
  if (!sub || sub.plan === "FREE" || !["ACTIVE", "TRIAL"].includes(sub.status)) {
    return 0;
  }

  const planCents = computePlanCentsFromSubscription(sub);
  const addonCents = computeAddonMonthlyCents(workspace?.workspaceAddons ?? []);
  return planCents + addonCents;
}

export async function syncReferralMonthlyRevenue(referredWorkspaceId: string): Promise<void> {
  const referral = await prisma.referral.findUnique({
    where: { referredWorkspaceId },
    select: { id: true, status: true },
  });
  if (!referral) {
    return;
  }

  const cents =
    referral.status === "ACTIVE"
      ? await monthlyRevenueForWorkspace(referredWorkspaceId)
      : 0;

  await prisma.referral.update({
    where: { id: referral.id },
    data: { monthlyRevenueCents: cents },
  });
}

export async function getReferralMrrImpact(referrerUserId: string): Promise<number> {
  const result = await prisma.referral.aggregate({
    where: { referrerUserId, status: "ACTIVE" },
    _sum: { monthlyRevenueCents: true },
  });
  return result._sum.monthlyRevenueCents ?? 0;
}

import { expectedRewardForPlan } from "@/features/referrals/server/referral-rewards-catalog";
