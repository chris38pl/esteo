"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import type { BillingPayerWorkspace } from "@/features/billing/lib/billing-permissions-logic";
import { UserBillingInvoicesTable } from "@/features/users/components/user-billing-invoices-table";
import type { UserBillingInvoiceItem } from "@/features/users/server/get-user-billing-invoices";
import { dashboardBillingHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";

export function UserSettingsBillingTab({
  invoices,
  locale,
  paidWorkspaces,
}: {
  invoices: UserBillingInvoiceItem[];
  locale: Locale;
  paidWorkspaces: BillingPayerWorkspace[];
}) {
  const t = useTranslations("billing.accountInvoices");
  const tPaid = useTranslations("billing.paidWorkspaces");

  return (
    <div className="space-y-10">
      {paidWorkspaces.length > 0 ? (
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">{tPaid("title")}</h2>
            <p className="text-sm text-muted-foreground">{tPaid("description")}</p>
          </div>

          <ul className="surface-card divide-y divide-border/60 overflow-hidden">
            {paidWorkspaces.map((workspace) => (
              <li key={workspace.id}>
                <Link
                  href={dashboardBillingHref(locale, workspace.slug)}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{workspace.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{workspace.slug}</p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
    </div>
  );
}
