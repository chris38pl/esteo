"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { PaginationControls } from "@/components/shared/pagination-controls";
import { EstimateEditorLayoutStyles } from "@/features/estimates/components/estimate-editor-layout-styles";
import { estimateEditorMaxWidthClass } from "@/features/estimates/lib/estimate-layout-config";
import { EstimateRequestFormHeroCard } from "@/features/estimate-requests/components/estimate-request-form-hero-card";
import { EstimatesListPlanLimitBanner } from "@/features/estimates/components/estimates-list-plan-limit-banner";
import { RequestsListFilterSheet } from "@/features/estimate-requests/components/requests-list-filter-sheet";
import { RequestsListTable } from "@/features/estimate-requests/components/requests-list-table";
import { RequestsListToolbar } from "@/features/estimate-requests/components/requests-list-toolbar";
import {
  EMPTY_REQUEST_LIST_DATE_RANGE,
  EMPTY_REQUEST_LIST_FILTER,
  hasActiveRequestDateRange,
  hasActiveRequestListFilters,
  requestIsVisible,
} from "@/features/estimate-requests/lib/requests-list-filter";
import type { WorkspaceRequestListItem } from "@/features/estimate-requests/server/workspace-requests";
import type { CreateEstimateGate } from "@/features/estimates/lib/create-estimate-gate";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface RequestsListPanelProps {
  requests: WorkspaceRequestListItem[];
  workspaceSlug: string;
  workspaceId: string;
  createEstimateGate: CreateEstimateGate;
  billingHref: string | null;
  locale: Locale;
}

const DEFAULT_PAGE_SIZE = 10;

export function RequestsListPanel({
  requests,
  workspaceSlug,
  workspaceId,
  createEstimateGate,
  billingHref,
  locale,
}: RequestsListPanelProps) {
  const t = useTranslations("requests");
  const canCreateEstimate = createEstimateGate.allowed;
  const estimateLimitReached = createEstimateGate.reason === "PLAN_LIMIT";
  const [searchQuery, setSearchQuery] = useState("");
  const [listFilter, setListFilter] = useState(EMPTY_REQUEST_LIST_FILTER);
  const [dateRange, setDateRange] = useState(EMPTY_REQUEST_LIST_DATE_RANGE);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const filterActive = hasActiveRequestListFilters(listFilter);
  const dateRangeActive = hasActiveRequestDateRange(dateRange);
  const hasActiveQuery =
    searchQuery.trim().length > 0 || filterActive || dateRangeActive;

  const filteredRequests = useMemo(() => {
    const list = requests.filter((request) =>
      requestIsVisible(request, {
        searchQuery,
        filter: listFilter,
        dateRange,
      }),
    );

    list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return list;
  }, [requests, searchQuery, listFilter, dateRange]);

  const totalCount = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRequests = filteredRequests.slice(
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

  const hasRequests = requests.length > 0;
  const hasFilteredResults = filteredRequests.length > 0;

  return (
    <div className={cn("mx-auto min-w-0 w-full space-y-6", estimateEditorMaxWidthClass)}>
      <EstimateEditorLayoutStyles />

      <EstimateRequestFormHeroCard workspaceSlug={workspaceSlug} locale={locale} />

      <EstimatesListPlanLimitBanner
        createEstimateGate={createEstimateGate}
        billingHref={billingHref}
      />

      <div className="surface-card overflow-hidden p-0">
        <RequestsListToolbar
          locale={locale}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          filterActive={filterActive}
          onOpenFilter={() => setFilterSheetOpen(true)}
          onClearFilter={() => setListFilter(EMPTY_REQUEST_LIST_FILTER)}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {!hasRequests ? (
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
          <RequestsListTable
            requests={pageRequests}
            workspaceSlug={workspaceSlug}
            workspaceId={workspaceId}
            canCreateEstimate={canCreateEstimate}
            estimateLimitReached={estimateLimitReached}
            billingHref={billingHref}
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

      <RequestsListFilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        requests={requests}
        searchQuery={searchQuery}
        appliedDateRange={dateRange}
        appliedFilter={listFilter}
        onApply={setListFilter}
      />
    </div>
  );
}
