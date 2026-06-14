"use client";

import type { SubscriptionPlan } from "@prisma/client";

import { getHeroCardLayoutCss } from "@/components/hero-card/hero-card-artwork";
import { BILLING_PLAN_HERO_BACKGROUNDS } from "@/features/billing/lib/billing-plan-hero-images";

export function BillingPlanHeroStyles({ plan }: { plan: SubscriptionPlan }) {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
${getHeroCardLayoutCss(".billing-plan-hero-card", BILLING_PLAN_HERO_BACKGROUNDS[plan], {
  bodyScrim: true,
})}
.billing-plan-hero-card .hero-card-content {
  max-width: min(58%, 34rem);
}
@media (max-width: 1280px) {
  .billing-plan-hero-card .hero-card-content {
    max-width: min(68%, 32rem);
  }
}
@media (max-width: 768px) {
  .billing-plan-hero-card .hero-card-content:not(.billing-plan-hero-actions) {
    max-width: min(88%, 100%);
  }
  .billing-plan-hero-card .billing-plan-hero-actions {
    max-width: 100%;
    width: 100%;
  }
  .billing-plan-hero-card .billing-plan-hero-artwork-main {
    right: -2.5rem;
  }
}
@media (max-width: 639px) {
  .billing-plan-hero-card .billing-plan-hero-actions {
    flex-direction: column;
  }
}
@media (max-width: 480px) {
  .billing-plan-hero-card .billing-plan-hero-artwork-main {
    right: -3.25rem;
  }
}
`.trim(),
      }}
    />
  );
}
