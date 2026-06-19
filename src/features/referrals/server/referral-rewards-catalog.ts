import { DEFAULT_PLAN_VERSION } from "@/server/billing/plan-catalog";
import { planFromPriceId } from "@/features/billing/server/stripe-plan-utils";
import type { SubscriptionPlan } from "@prisma/client";

/** One-time activation bonus in grosze, keyed by planVersion. */
export const REFERRAL_REWARD_CENTS: Record<string, number> = {
  PRO_2026: 3000,
  BUSINESS_2026: 8000,
};

export function rewardForPlanVersion(planVersion: string): number {
  const cents = REFERRAL_REWARD_CENTS[planVersion];
  if (cents == null) {
    throw new Error(`No referral reward configured for planVersion ${planVersion}`);
  }
  return cents;
}

export function rewardForPriceId(priceId: string): number {
  const plan = planFromPriceId(priceId);
  if (!plan || plan === "FREE") {
    throw new Error(`No referral reward for priceId ${priceId}`);
  }
  return rewardForPlanVersion(DEFAULT_PLAN_VERSION[plan]);
}

export function expectedRewardForPlan(plan: SubscriptionPlan): number | null {
  if (plan === "FREE") {
    return null;
  }
  return REFERRAL_REWARD_CENTS[DEFAULT_PLAN_VERSION[plan]] ?? null;
}

export function isRewardEligiblePlanVersion(planVersion: string): boolean {
  return planVersion in REFERRAL_REWARD_CENTS;
}
