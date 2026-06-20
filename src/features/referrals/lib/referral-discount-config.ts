export const REFERRAL_DISCOUNT_PERCENT = 20;
export const REFERRAL_DISCOUNT_MONTHS = 3;

export function applyReferralDiscountCents(priceCents: number): number {
  return Math.round((priceCents * (100 - REFERRAL_DISCOUNT_PERCENT)) / 100);
}
