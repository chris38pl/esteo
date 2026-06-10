"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { PaymentListRow } from "./payment-list-row";
import type { PaymentListPageItem } from "@/features/payments/server/list-payments-page-data";
import type { Locale } from "@/lib/locale";

interface PaymentsListTableProps {
  payments: PaymentListPageItem[];
  workspaceSlug: string;
  locale: Locale;
  footer?: ReactNode;
}

const thClassName =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

export function PaymentsListTable({
  payments,
  workspaceSlug,
  locale,
  footer,
}: PaymentsListTableProps) {
  const t = useTranslations("payments");

  return (
    <>
      <div className="space-y-3 p-3 md:hidden">
        {payments.map((item) => (
          <PaymentListRow
            key={item.installment.id}
            item={item}
            workspaceSlug={workspaceSlug}
            locale={locale}
            layout="list"
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[48rem] text-sm">
          <thead className="border-b border-border/60 bg-muted/30">
            <tr>
              <th className={thClassName}>{t("list.columns.payment")}</th>
              <th className={`${thClassName} hidden md:table-cell`}>{t("list.columns.client")}</th>
              <th className={`${thClassName} hidden lg:table-cell`}>{t("list.columns.estimate")}</th>
              <th className={`${thClassName} hidden xl:table-cell`}>{t("list.columns.dueDate")}</th>
              <th className={`${thClassName} text-right`}>{t("list.columns.grossValue")}</th>
              <th className={`${thClassName} hidden text-right sm:table-cell`}>
                {t("list.columns.received")}
              </th>
              <th className={`${thClassName} hidden text-right lg:table-cell`}>
                {t("list.columns.remaining")}
              </th>
              <th className={thClassName}>{t("list.columns.status")}</th>
              <th className="w-10 px-2 py-3" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {payments.map((item) => (
              <PaymentListRow
                key={item.installment.id}
                item={item}
                workspaceSlug={workspaceSlug}
                locale={locale}
                layout="table"
              />
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </>
  );
}
