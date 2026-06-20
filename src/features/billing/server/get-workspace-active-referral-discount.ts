import "server-only";

import type Stripe from "stripe";

import type { WorkspaceActiveReferralDiscount } from "@/features/billing/billing-page-data";
import { getStripeClient } from "@/features/billing/server/stripe-client";
import { REFERRAL_DISCOUNT_PERCENT } from "@/features/referrals/lib/referral-discount-config";
import { getReferralCouponId } from "@/features/referrals/server/referral-checkout-discount";

function isExpandedDiscount(
  entry: string | Stripe.Discount,
): entry is Stripe.Discount {
  return typeof entry === "object" && entry.object === "discount";
}

function resolveCouponFromDiscount(
  discount: Stripe.Discount,
): Stripe.Coupon | string | null {
  if (discount.source.type !== "coupon") {
    return null;
  }
  return discount.source.coupon;
}

function resolveCouponId(coupon: Stripe.Coupon | string | null | undefined): string | null {
  if (!coupon) {
    return null;
  }
  return typeof coupon === "string" ? coupon : coupon.id;
}

function resolveCouponPercent(coupon: Stripe.Coupon | string | null | undefined): number {
  if (!coupon || typeof coupon === "string") {
    return REFERRAL_DISCOUNT_PERCENT;
  }
  return coupon.percent_off ?? REFERRAL_DISCOUNT_PERCENT;
}

function collectSubscriptionDiscounts(
  subscription: Stripe.Subscription,
): Stripe.Discount[] {
  if (!Array.isArray(subscription.discounts)) {
    return [];
  }

  return subscription.discounts.filter(isExpandedDiscount);
}

function findReferralDiscount(
  discounts: Stripe.Discount[],
  referralCouponId: string,
): Stripe.Discount | null {
  for (const discount of discounts) {
    const couponId = resolveCouponId(resolveCouponFromDiscount(discount));
    if (couponId === referralCouponId) {
      return discount;
    }
  }
  return null;
}

function resolveDiscountEndUnix(
  discount: Stripe.Discount,
  coupon: Stripe.Coupon | string | null,
): number | null {
  if (discount.end != null) {
    return discount.end;
  }

  if (
    typeof coupon === "object" &&
    coupon?.duration === "repeating" &&
    coupon.duration_in_months != null
  ) {
    const start = new Date(discount.start * 1000);
    const end = new Date(start);
    end.setMonth(end.getMonth() + coupon.duration_in_months);
    return Math.floor(end.getTime() / 1000);
  }

  return null;
}

export async function getWorkspaceActiveReferralDiscount(params: {
  stripeSubscriptionId: string | null | undefined;
  stripeRecurringCents: number | null | undefined;
}): Promise<WorkspaceActiveReferralDiscount | null> {
  const referralCouponId = getReferralCouponId();
  if (!referralCouponId || !params.stripeSubscriptionId) {
    return null;
  }

  const stripe = getStripeClient();

  try {
    const subscription = await stripe.subscriptions.retrieve(params.stripeSubscriptionId, {
      expand: ["discounts", "discounts.source.coupon"],
    });

    const referralDiscount = findReferralDiscount(
      collectSubscriptionDiscounts(subscription),
      referralCouponId,
    );

    if (!referralDiscount) {
      return null;
    }

    const coupon = resolveCouponFromDiscount(referralDiscount);
    const endsAtUnix = resolveDiscountEndUnix(referralDiscount, coupon);
    if (endsAtUnix == null) {
      return null;
    }

    const discountedRecurringCents =
      params.stripeRecurringCents != null && params.stripeRecurringCents > 0
        ? params.stripeRecurringCents
        : null;

    if (discountedRecurringCents == null) {
      return null;
    }

    return {
      percent: resolveCouponPercent(coupon),
      endsAt: new Date(endsAtUnix * 1000).toISOString(),
      discountedRecurringCents,
    };
  } catch {
    return null;
  }
}
