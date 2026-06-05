import type { Locale } from "@/lib/locale";

export function dashboardAccountHref(locale: Locale) {
  return `/${locale}/dashboard/account`;
}

export function dashboardBillingHref(locale: Locale) {
  return `/${locale}/dashboard/billing`;
}
