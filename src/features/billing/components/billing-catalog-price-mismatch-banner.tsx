"use client";

import { useLocale, useTranslations } from "next-intl";

import type { WorkspaceBillingPricing } from "@/features/billing/billing-page-data";
import { formatBillingMonthlyPrice } from "@/features/billing/lib/format-billing-amount";
import type { Locale } from "@/lib/locale";

export function BillingCatalogPriceMismatchBanner({
  pricing,
}: {
  pricing: WorkspaceBillingPricing;
}) {
  const t = useTranslations("billing.workspace.catalogMismatch");
  const locale = useLocale() as Locale;

  if (!pricing.catalogPriceMismatch || pricing.stripeRecurringCents == null) {
    return null;
  }

  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
      <p className="font-medium">{t("title")}</p>
      <ul className="mt-2 space-y-1">
        <li>
          {t("stripe", {
            amount: formatBillingMonthlyPrice(
              pricing.stripeRecurringCents,
              locale,
              pricing.currency,
            ),
          })}
        </li>
        <li>
          {t("esteo", {
            amount: formatBillingMonthlyPrice(pricing.recurringCents, locale, pricing.currency),
          })}
        </li>
      </ul>
    </div>
  );
}
