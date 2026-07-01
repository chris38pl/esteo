"use client";

import type { EstimateVersionStatus } from "@prisma/client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { PaginationControls } from "@/components/shared/pagination-controls";
import { AdminEstimatesListTable } from "@/features/estimates/admin-list/components/admin-estimates-list-table";
import { AdminEstimatesListToolbar } from "@/features/estimates/admin-list/components/admin-estimates-list-toolbar";
import { AdminEstimatesStatusFilterSheet } from "@/features/estimates/admin-list/components/admin-estimates-status-filter-sheet";
import { EstimatesListStatsCards } from "@/features/estimates/components/estimates-list-stats-cards";
import { useEstimatesListPreferences } from "@/features/estimates/hooks/use-estimates-list-preferences";
import {
  buildEstimatesListCsv,
  downloadEstimatesListCsv,
} from "@/features/estimates/lib/estimate-list-export";
import {
  hasActiveDateRange,
  type EstimateListDateRange,
} from "@/features/estimates/lib/estimate-list-filter";
import type {
  AdminEstimateListRow,
  AdminEstimateWorkspaceFilterOption,
} from "@/features/estimates/server/admin-estimates";
import type { EstimateListPageItem } from "@/features/estimates/server/list-estimates-page-data";
import type { Locale } from "@/lib/locale";
import type { PaginatedResult } from "@/lib/pagination";
import { usePaginationUrl } from "@/lib/pagination";

interface AdminEstimatesListPanelProps {
  locale: Locale;
  initialData: PaginatedResult<AdminEstimateListRow>;
  statsEstimates: EstimateListPageItem[];
  workspaceOptions: AdminEstimateWorkspaceFilterOption[];
  initialSearch: string;
  initialWorkspaceId: string | null;
  initialStatus: EstimateVersionStatus | null;
  initialDateRange: EstimateListDateRange;
}

function serializeDate(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export function AdminEstimatesListPanel({
  locale,
  initialData,
  statsEstimates,
  workspaceOptions,
  initialSearch,
  initialWorkspaceId,
  initialStatus,
  initialDateRange,
}: AdminEstimatesListPanelProps) {
  const tEstimates = useTranslations("estimates");
  const tAdmin = useTranslations("admin.estimates");
  const { setSearch: setSearchInUrl, setPage, setPageSize: setPageSizeInUrl, updateQuery } =
    usePaginationUrl();
  const { preferences, toggleOptionalColumn, setPageSize: setStoredPageSize } =
    useEstimatesListPreferences("admin-estimates");

  const [search, setSearch] = useState(initialSearch);
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [, startTransition] = useTransition();

  const syncedSearchRef = useRef(initialSearch);

  useEffect(() => {
    syncedSearchRef.current = initialSearch;
  }, [initialSearch]);

  useEffect(() => {
    if (search === syncedSearchRef.current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      syncedSearchRef.current = search.trim();
      startTransition(() => {
        setSearchInUrl(search);
      });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search, setSearchInUrl]);

  const filterActive = initialStatus !== null;

  const handleWorkspaceChange = useCallback(
    (workspaceId: string | null) => {
      startTransition(() => {
        updateQuery({
          page: "1",
          workspaceId,
        });
      });
    },
    [updateQuery],
  );

  const handleDateRangeChange = useCallback(
    (nextRange: EstimateListDateRange) => {
      setDateRange(nextRange);
      const hasRange = hasActiveDateRange(nextRange);

      startTransition(() => {
        updateQuery({
          page: "1",
          dateField: hasRange ? nextRange.field : null,
          dateFrom: hasRange ? serializeDate(nextRange.from) : null,
          dateTo: hasRange ? serializeDate(nextRange.to) : null,
        });
      });
    },
    [updateQuery],
  );

  const handleStatusApply = useCallback(
    (status: EstimateVersionStatus | null) => {
      startTransition(() => {
        updateQuery({
          page: "1",
          status,
        });
      });
    },
    [updateQuery],
  );

  const handleClearFilter = useCallback(() => {
    handleStatusApply(null);
  }, [handleStatusApply]);

  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      if (pageSize !== 10 && pageSize !== 20 && pageSize !== 50) {
        return;
      }

      setStoredPageSize(pageSize);
      startTransition(() => {
        setPageSizeInUrl(pageSize);
      });
    },
    [setPageSizeInUrl, setStoredPageSize],
  );

  const handleExportCsv = useCallback(() => {
    if (initialData.items.length === 0) {
      return;
    }

    const workspaceByEstimateId = new Map(
      initialData.items.map((estimate) => [
        estimate.id,
        {
          workspaceName: estimate.workspaceName,
          ownerLabel: estimate.workspaceOwnerName ?? estimate.workspaceOwnerEmail,
        },
      ]),
    );

    const csv = buildEstimatesListCsv(
      initialData.items,
      {
        estimateName: tEstimates("list.columns.estimateName"),
        workspace: tAdmin("columns.workspace"),
        owner: tAdmin("columns.owner"),
        inquiry: tEstimates("list.columns.inquiry"),
        investment: tEstimates("list.columns.investment"),
        client: tEstimates("list.columns.client"),
        updated: tEstimates("list.columns.updated"),
        value: tEstimates("list.columns.value"),
        status: tEstimates("list.columns.status"),
      },
      locale,
      (status) => tEstimates(`status.${status}`),
      {
        includeWorkspace: true,
        workspaceByEstimateId,
      },
    );

    downloadEstimatesListCsv(csv, tAdmin("exportFilePrefix"));
  }, [initialData.items, locale, tAdmin, tEstimates]);

  const hasResults = initialData.items.length > 0;

  return (
    <div className="space-y-6">
      <EstimatesListStatsCards estimates={statsEstimates} locale={locale} />

      <div className="surface-card overflow-hidden p-0">
        <AdminEstimatesListToolbar
          locale={locale}
          searchQuery={search}
          onSearchQueryChange={setSearch}
          filterActive={filterActive}
          onOpenFilter={() => setFilterSheetOpen(true)}
          onClearFilter={handleClearFilter}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          workspaceOptions={workspaceOptions}
          workspaceId={initialWorkspaceId}
          onWorkspaceChange={handleWorkspaceChange}
          preferences={preferences}
          onToggleColumn={toggleOptionalColumn}
          onPageSizeChange={handlePageSizeChange}
          onExportCsv={handleExportCsv}
          canExportCsv={hasResults}
        />

        {!hasResults ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">{tAdmin("empty")}</p>
          </div>
        ) : (
          <AdminEstimatesListTable
            estimates={initialData.items}
            locale={locale}
            visibleColumns={preferences.visibleColumns}
            footer={
              <div className="border-t border-border/60 px-4 py-3">
                <PaginationControls
                  page={initialData.page}
                  pageSize={initialData.pageSize}
                  totalCount={initialData.totalCount}
                  totalPages={initialData.totalPages}
                  hasPreviousPage={initialData.hasPreviousPage}
                  hasNextPage={initialData.hasNextPage}
                  onPageChange={setPage}
                />
              </div>
            }
          />
        )}

        {!hasResults ? (
          <div className="border-t border-border/60 px-4 py-3">
            <PaginationControls
              page={initialData.page}
              pageSize={initialData.pageSize}
              totalCount={initialData.totalCount}
              totalPages={initialData.totalPages}
              hasPreviousPage={initialData.hasPreviousPage}
              hasNextPage={initialData.hasNextPage}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </div>

      <AdminEstimatesStatusFilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        value={initialStatus}
        onApply={handleStatusApply}
      />
    </div>
  );
}
