"use client";

import { useTranslations } from "next-intl";

import { UserBillingInvoiceRow } from "@/features/users/components/user-billing-invoice-row";
import type { UserBillingInvoiceItem } from "@/features/users/server/get-user-billing-invoices";
import type { Locale } from "@/lib/locale";

interface UserBillingInvoicesTableProps {
  invoices: UserBillingInvoiceItem[];
  locale: Locale;
}

const thClassName =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

export function UserBillingInvoicesTable({ invoices, locale }: UserBillingInvoicesTableProps) {
  const t = useTranslations("billing.accountInvoices");

  return (
    <>
      <div className="space-y-3 p-3 md:hidden">
        {invoices.map((invoice) => (
          <UserBillingInvoiceRow
            key={invoice.id}
            invoice={invoice}
            locale={locale}
            layout="list"
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[32rem] text-sm">
          <thead className="border-b border-border/60 bg-muted/30">
            <tr>
              <th className={thClassName}>{t("columns.invoice")}</th>
              <th className={thClassName}>{t("columns.date")}</th>
              <th className="w-12 px-2 py-3">
                <span className="sr-only">{t("columns.download")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <UserBillingInvoiceRow
                key={invoice.id}
                invoice={invoice}
                locale={locale}
                layout="table"
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
