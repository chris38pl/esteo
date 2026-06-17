"use client";

import { useTranslations } from "next-intl";

import { UserBillingInvoicesTable } from "@/features/users/components/user-billing-invoices-table";
import type { UserBillingInvoiceItem } from "@/features/users/server/get-user-billing-invoices";
import type { Locale } from "@/lib/locale";

export function UserSettingsBillingTab({
  invoices,
  locale,
}: {
  invoices: UserBillingInvoiceItem[];
  locale: Locale;
}) {
  const t = useTranslations("billing.accountInvoices");

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="surface-card overflow-hidden p-0">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          </div>
        ) : (
          <UserBillingInvoicesTable invoices={invoices} locale={locale} />
        )}
      </div>
    </section>
  );
}
