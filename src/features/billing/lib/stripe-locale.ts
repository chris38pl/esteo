import type { Locale } from "@/lib/locale";

/** Maps app locale to Stripe Customer Portal / Checkout locale. */
export function toStripeLocale(locale: Locale): "pl" | "en" {
  return locale === "en" ? "en" : "pl";
}
