"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { PaginationControls } from "@/components/shared/pagination-controls";
import { EstimateEditorLayoutStyles } from "@/features/estimates/components/estimate-editor-layout-styles";
import { estimateEditorMaxWidthClass } from "@/features/estimates/lib/estimate-layout-config";
import {
  EMPTY_PAYMENT_LIST_DATE_RANGE,
  paymentIsVisible,
  type PaymentListStatusTab,
} from "@/features/payments/lib/payment-list-filter";
import type { PaymentListPageItem } from "@/features/payments/server/list-payments-page-data";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { PaymentsListStatsCards } from "./payments-list-stats-cards";
import { PaymentsListStatusTabs } from "./payments-list-status-tabs";
import { PaymentsListTable } from "./payments-list-table";
import { PaymentsListToolbar } from "./payments-list-toolbar";

interface PaymentsListPanelProps {
  payments: PaymentListPageItem[];
  workspaceSlug: string;
  locale: Locale;
}

const DEFAULT_PAGE_SIZE = 10;

export function PaymentsListPanel({
  payments,
  workspaceSlug,
  locale,
}: PaymentsListPanelProps) {
  const t = useTranslations("payments");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState<PaymentListStatusTab>("ALL");
  const [dateRange, setDateRange] = useState(EMPTY_PAYMENT_LIST_DATE_RANGE);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const statusCounts = useMemo(() => {
    const counts: Record<PaymentListStatusTab, number> = {
      ALL: payments.length,
      PAID: 0,
      PARTIAL: 0,
      PENDING: 0,
      OVERDUE: 0,
    };

    for (const item of payments) {
      counts[item.status] += 1;
    }

    return counts;
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const list = payments.filter((item) =>
      paymentIsVisible(item, {
        searchQuery,
        statusTab,
        dateRange,
      }),
    );

    list.sort((a, b) => {
      const aDate = a.installment.dueDate ?? a.installment.createdAt;
      const bDate = b.installment.dueDate ?? b.installment.createdAt;
      return aDate.localeCompare(bDate);
    });

    return list;
  }, [payments, searchQuery, statusTab, dateRange]);

  const totalCount = filteredPayments.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagePayments = filteredPayments.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const hasActiveQuery =
    searchQuery.trim().length > 0 ||
    statusTab !== "ALL" ||
    dateRange.from !== null ||
    dateRange.to !== null;

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusTab, dateRange]);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const hasPayments = payments.length > 0;
  const hasFilteredResults = filteredPayments.length > 0;

  return (
    <div className={cn("mx-auto min-w-0 w-full space-y-6", estimateEditorMaxWidthClass)}>
      <EstimateEditorLayoutStyles />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{t("page.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("page.subtitle")}</p>
        </div>
      </div>

      <PaymentsListStatsCards payments={payments} locale={locale} />

      <div className="surface-card overflow-hidden p-0">
        <PaymentsListStatusTabs
          activeTab={statusTab}
          onTabChange={setStatusTab}
          counts={statusCounts}
        />

        <PaymentsListToolbar
          locale={locale}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {!hasPayments ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">{t("page.empty")}</p>
          </div>
        ) : !hasFilteredResults ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {hasActiveQuery ? t("list.noSearchResults") : t("page.empty")}
            </p>
          </div>
        ) : (
          <PaymentsListTable
            payments={pagePayments}
            workspaceSlug={workspaceSlug}
            locale={locale}
            footer={
              <PaginationControls
                className="px-4 pb-4"
                page={safePage}
                pageSize={pageSize}
                totalCount={totalCount}
                totalPages={totalPages}
                hasPreviousPage={safePage > 1}
                hasNextPage={safePage < totalPages}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            }
          />
        )}
      </div>
    </div>
  );
}
