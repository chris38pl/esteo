"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { PaginationControls } from "@/components/shared/pagination-controls";
import { Button } from "@/components/ui/button";
import { estimateEditorMaxWidthClass } from "@/features/estimates/lib/estimate-layout-config";
import {
  EMPTY_ESTIMATE_LIST_DATE_RANGE,
  EMPTY_ESTIMATE_LIST_FILTER,
  estimateIsVisible,
  hasActiveDateRange,
  hasActiveListFilters,
} from "@/features/estimates/lib/estimate-list-filter";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { CreateEstimateModal } from "./create-estimate-modal";
import { EstimateEditorLayoutStyles } from "./estimate-editor-layout-styles";
import { EstimatesListFilterSheet } from "./estimates-list-filter-sheet";
import { EstimatesListHeroCards } from "./estimates-list-hero-cards";
import { EstimatesListStatsCards } from "./estimates-list-stats-cards";
import { useEstimatesListPreferences } from "@/features/estimates/hooks/use-estimates-list-preferences";
import {
  buildEstimatesListCsv,
  downloadEstimatesListCsv,
} from "@/features/estimates/lib/estimate-list-export";
import { EstimatesListTable } from "./estimates-list-table";
import { EstimatesListToolbar } from "./estimates-list-toolbar";
import type { EstimateListPageItem } from "@/features/estimates/server/list-estimates-page-data";
import type { PublicEstimateRequestPageData } from "@/features/estimate-requests/server/public-service";

interface EstimatesListPanelProps {
  estimates: EstimateListPageItem[];
  createFormData: PublicEstimateRequestPageData;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
}

export function EstimatesListPanel({
  estimates,
  createFormData,
  workspaceId,
  workspaceSlug,
  locale,
}: EstimatesListPanelProps) {
  const t = useTranslations("estimates");
  const { preferences, toggleOptionalColumn, setPageSize } =
    useEstimatesListPreferences(workspaceSlug);
  const { visibleColumns, pageSize } = preferences;
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [listFilter, setListFilter] = useState(EMPTY_ESTIMATE_LIST_FILTER);
  const [dateRange, setDateRange] = useState(EMPTY_ESTIMATE_LIST_DATE_RANGE);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [page, setPage] = useState(1);

  const handlePageSizeChange = (nextPageSize: number) => {
    if (nextPageSize !== 10 && nextPageSize !== 20 && nextPageSize !== 50) {
      return;
    }
    setPageSize(nextPageSize);
    setPage(1);
  };

  const filterActive = hasActiveListFilters(listFilter);
  const dateRangeActive = hasActiveDateRange(dateRange);
  const hasActiveQuery =
    searchQuery.trim().length > 0 || filterActive || dateRangeActive;

  const filteredEstimates = useMemo(() => {
    const list = estimates.filter((estimate) =>
      estimateIsVisible(estimate, {
        searchQuery,
        filter: listFilter,
        dateRange,
      }),
    );

    list.sort((a, b) => {
      const aDate = a.latestVersion?.updatedAt ?? a.createdAt;
      const bDate = b.latestVersion?.updatedAt ?? b.createdAt;
      return bDate.getTime() - aDate.getTime();
    });

    return list;
  }, [estimates, searchQuery, listFilter, dateRange]);

  const totalCount = filteredEstimates.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageEstimates = filteredEstimates.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery, listFilter, dateRange]);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const hasEstimates = estimates.length > 0;
  const hasFilteredResults = filteredEstimates.length > 0;

  const handleExportCsv = useCallback(() => {
    if (filteredEstimates.length === 0) {
      return;
    }

    const csv = buildEstimatesListCsv(
      filteredEstimates,
      {
        estimateName: t("list.columns.estimateName"),
        inquiry: t("list.columns.inquiry"),
        investment: t("list.columns.investment"),
        client: t("list.columns.client"),
        updated: t("list.columns.updated"),
        value: t("list.columns.value"),
        status: t("list.columns.status"),
      },
      locale,
      (status) => t(`status.${status}`),
    );

    downloadEstimatesListCsv(csv, workspaceSlug);
  }, [filteredEstimates, locale, t, workspaceSlug]);

  return (
    <div className={cn("mx-auto min-w-0 w-full space-y-6", estimateEditorMaxWidthClass)}>
      <EstimateEditorLayoutStyles />
      <EstimatesListHeroCards
        workspaceSlug={workspaceSlug}
        locale={locale}
        onCreateClick={() => setCreateOpen(true)}
      />

      <EstimatesListStatsCards estimates={estimates} locale={locale} />

      <div className="surface-card overflow-hidden p-0">
        <EstimatesListToolbar
          locale={locale}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          filterActive={filterActive}
          onOpenFilter={() => setFilterSheetOpen(true)}
          onClearFilter={() => setListFilter(EMPTY_ESTIMATE_LIST_FILTER)}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          preferences={preferences}
          onToggleColumn={toggleOptionalColumn}
          onPageSizeChange={handlePageSizeChange}
          onExportCsv={handleExportCsv}
          canExportCsv={hasFilteredResults}
        />

        {!hasEstimates ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">{t("page.empty")}</p>
            <Button variant="outline" onClick={() => setCreateOpen(true)}>
              {t("page.createFirst")}
            </Button>
          </div>
        ) : !hasFilteredResults ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {hasActiveQuery ? t("list.noSearchResults") : t("page.empty")}
            </p>
          </div>
        ) : (
          <EstimatesListTable
            estimates={pageEstimates}
            workspaceSlug={workspaceSlug}
            locale={locale}
            visibleColumns={visibleColumns}
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
                onPageSizeChange={handlePageSizeChange}
              />
            }
          />
        )}
      </div>

      <EstimatesListFilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        estimates={estimates}
        searchQuery={searchQuery}
        appliedDateRange={dateRange}
        appliedFilter={listFilter}
        onApply={setListFilter}
      />

      <CreateEstimateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        formData={createFormData}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        locale={locale}
      />
    </div>
  );
}
