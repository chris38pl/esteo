import "server-only";

import type { SubscriptionPlan } from "@prisma/client";

import type { WorkspaceBillingPlansPageData } from "@/features/billing/billing-plans-page-data";
import { prisma } from "@/db/client";
import { getWorkspaceEntitlements } from "@/server/billing/entitlement-service";
import { resolvePlanLimits } from "@/server/billing/plan-catalog";
import { resolveCurrentPlanPrice } from "@/server/billing/plan-pricing";
import { loadWorkspaceAddonQuantities } from "@/features/billing/server/workspace-addon-sync";
import { getActiveSubscriptionChange } from "@/features/billing/server/subscription-change";
import { addonRowsToQuantities } from "@/features/billing/lib/subscription-impact";
import {
  applyReferralDiscountCents,
  REFERRAL_DISCOUNT_MONTHS,
  REFERRAL_DISCOUNT_PERCENT,
} from "@/features/referrals/lib/referral-discount-config";
import { getReferralDiscountEligibility } from "@/features/referrals/server/referral-checkout-discount";

const COMPARISON_PLANS: SubscriptionPlan[] = ["FREE", "PRO", "BUSINESS"];

export async function getWorkspaceBillingPlansPageData(
  workspaceId: string,
): Promise<WorkspaceBillingPlansPageData> {
  const [entitlements, subscriptionRow, addonRows] = await Promise.all([
    getWorkspaceEntitlements(workspaceId),
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        billingAccount: {
          select: {
            subscription: {
              select: {
                id: true,
                cancelAtPeriodEnd: true,
                currentPeriodEnd: true,
              },
            },
          },
        },
      },
    }),
    loadWorkspaceAddonQuantities(workspaceId),
  ]);

  const subscription = subscriptionRow?.billingAccount?.subscription ?? null;
  const addonQuantities = addonRowsToQuantities(addonRows);
  const activeSubscriptionChange = subscription
    ? await getActiveSubscriptionChange(subscription.id)
    : null;

  const planLimits = Object.fromEntries(
    COMPARISON_PLANS.map((plan) => [plan, resolvePlanLimits(plan)]),
  ) as Record<SubscriptionPlan, ReturnType<typeof resolvePlanLimits>>;

  const catalogPlanPriceCents = Object.fromEntries(
    COMPARISON_PLANS.map((plan) => [plan, resolveCurrentPlanPrice(plan)]),
  ) as Record<SubscriptionPlan, number>;

  const referralEligibility = await getReferralDiscountEligibility(workspaceId);
  const referralDiscount =
    referralEligibility.eligible
      ? {
          percent: REFERRAL_DISCOUNT_PERCENT,
          months: REFERRAL_DISCOUNT_MONTHS,
          discountedPlanPriceCents: {
            PRO: applyReferralDiscountCents(catalogPlanPriceCents.PRO),
            BUSINESS: applyReferralDiscountCents(catalogPlanPriceCents.BUSINESS),
          },
        }
      : null;
  const referralDiscountUnavailable =
    referralEligibility.reason === "no_coupon_config";

  if (referralDiscountUnavailable) {
    console.warn(
      `[referral] Workspace ${workspaceId} has pending referral but STRIPE_REFERRAL_COUPON_ID missing - promo hidden, checkout blocked`,
    );
  }

  return {
    currentPlan: entitlements.plan,
    effectiveStatus: entitlements.effectiveStatus,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    planLimits,
    catalogPlanPriceCents,
    addonQuantities,
    activeSubscriptionChange,
    referralDiscount,
    referralDiscountUnavailable,
  };
}
