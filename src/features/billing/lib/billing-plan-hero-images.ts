import type { SubscriptionPlan } from "@prisma/client";

/**
 * Background artwork for billing plan hero banner.
 *
 * Place files in `public/images/billing/` (see README in that folder).
 */
export const BILLING_PLAN_HERO_IMAGES: Record<
  SubscriptionPlan,
  { light: string; dark: string }
> = {
  FREE: {
    light: "/images/billing/hero-free-light.webp",
    dark: "/images/billing/hero-free-dark.webp",
  },
  PRO: {
    light: "/images/billing/hero-pro-light.webp",
    dark: "/images/billing/hero-pro-dark.webp",
  },
  BUSINESS: {
    light: "/images/billing/hero-business-light.webp",
    dark: "/images/billing/hero-business-dark.webp",
  },
};

/** Card fills - must match artwork edge colors for a seamless blend. */
export const BILLING_PLAN_HERO_BACKGROUNDS: Record<
  SubscriptionPlan,
  { light: string; dark: string }
> = {
  FREE: {
    light: "#f8fafc",
    dark: "#0c1222",
  },
  PRO: {
    light: "#eff6ff",
    dark: "#0b152d",
  },
  BUSINESS: {
    light: "#f5f3ff",
    dark: "#0f0818",
  },
};

export function billingPlanHeroCardClass(plan: SubscriptionPlan): string {
  return `billing-plan-hero-card--${plan.toLowerCase()}`;
}
