"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { IssuesListBulkActions } from "@/features/issues/components/issues-list-bulk-actions";
import { IssuesListFilterSheet } from "@/features/issues/components/issues-list-filter-sheet";
import { IssuesListHeroCard } from "@/features/issues/components/issues-list-hero-card";
import { IssuesListTable } from "@/features/issues/components/issues-list-table";
import { IssuesListToolbar } from "@/features/issues/components/issues-list-toolbar";
import {
  ReportIssueDialog,
  type CreatedIssueSummary,
} from "@/features/issues/components/report-issue-dialog";
import type { AdminIssueStatus } from "@/features/issues/schemas/issue";
import {
  EMPTY_ISSUES_LIST_DATE_RANGE,
  EMPTY_ISSUES_LIST_FILTER,
  hasActiveIssuesDateRange,
  hasActiveIssuesListFilters,
  issueIsVisible,
} from "@/features/issues/lib/issues-list-filter";
import { issuesListMaxWidthClass } from "@/features/issues/lib/issues-layout";
import type { IssuesRouteVariant } from "@/features/issues/lib/issues-base-path";
import type { AdminIssueListItem } from "@/features/issues/server/repository";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const DEFAULT_PAGE_SIZE = 10;

export function AdminIssuesListPanel({
  issues,
  locale,
  issuesVariant = "admin",
}: {
  issues: AdminIssueListItem[];
  locale: Locale;
  issuesVariant?: IssuesRouteVariant;
}) {
  const t = useTranslations("issues");
  const router = useRouter();
  const { workspaces, activeWorkspaceId } = useWorkspaceContext();
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId);

  const [searchQuery, setSearchQuery] = useState("");
  const [listFilter, setListFilter] = useState(EMPTY_ISSUES_LIST_FILTER);
  const [dateRange, setDateRange] = useState(EMPTY_ISSUES_LIST_DATE_RANGE);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [issuesList, setIssuesList] = useState(issues);
  const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(new Set());

  useEffect(() => {
    setIssuesList(issues);
    setSelectedNumbers(new Set());
  }, [issues]);

  function handleIssueCreated(created: CreatedIssueSummary) {
    setIssuesList((current) => {
      if (current.some((issue) => issue.number === created.number)) {
        return current;
      }

      const optimisticIssue: AdminIssueListItem = {
        number: created.number,
        title: created.title,
        type: created.type,
        priority: created.priority,
        status: "OPEN",
        createdAt: new Date(),
        folderSlug: created.folderSlug,
        attachmentCount: 0,
      };

      return [optimisticIssue, ...current];
    });

    try {
      router.refresh();
    } catch {
      // Keep optimistic row if refresh fails.
    }
  }

  const filterActive = hasActiveIssuesListFilters(listFilter);
  const dateRangeActive = hasActiveIssuesDateRange(dateRange);
  const hasActiveQuery =
    searchQuery.trim().length > 0 || filterActive || dateRangeActive;

  const filteredIssues = useMemo(() => {
    return issuesList.filter((issue) =>
      issueIsVisible(issue, {
        searchQuery,
        filter: listFilter,
        dateRange,
      }),
    );
  }, [issuesList, searchQuery, listFilter, dateRange]);

  const totalCount = filteredIssues.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageIssues = filteredIssues.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selectedOnPageCount = pageIssues.filter((issue) =>
    selectedNumbers.has(issue.number),
  ).length;
  const pageSelectionState =
    pageIssues.length === 0 || selectedOnPageCount === 0
      ? "none"
      : selectedOnPageCount === pageIssues.length
        ? "all"
        : "some";
  const selectedNumbersList = useMemo(
    () => Array.from(selectedNumbers),
    [selectedNumbers],
  );

  const clearSelection = useCallback(() => {
    setSelectedNumbers(new Set());
  }, []);

  const toggleIssueSelection = useCallback((number: number, checked: boolean) => {
    setSelectedNumbers((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(number);
      } else {
        next.delete(number);
      }
      return next;
    });
  }, []);

  const togglePageSelection = useCallback(
    (checked: boolean) => {
      setSelectedNumbers((current) => {
        const next = new Set(current);
        for (const issue of pageIssues) {
          if (checked) {
            next.add(issue.number);
          } else {
            next.delete(issue.number);
          }
        }
        return next;
      });
    },
    [pageIssues],
  );

  function handleBulkStatusUpdated(numbers: number[], status: AdminIssueStatus) {
    const updatedNumbers = new Set(numbers);
    setIssuesList((current) =>
      current.map((issue) =>
        updatedNumbers.has(issue.number) ? { ...issue, status } : issue,
      ),
    );

    try {
      router.refresh();
    } catch {
      // Keep optimistic rows if refresh fails.
    }
  }

  const hasIssues = issuesList.length > 0;
  const hasFilteredResults = filteredIssues.length > 0;

  return (
    <div className={cn("mx-auto min-w-0 w-full space-y-6", issuesListMaxWidthClass)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("admin.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.subtitle")}</p>
      </div>

      <IssuesListHeroCard onCreateIssue={() => setReportDialogOpen(true)} />

      <div className="surface-card overflow-hidden p-0">
        <IssuesListToolbar
          locale={locale}
          searchQuery={searchQuery}
          onSearchQueryChange={(query) => {
            setSearchQuery(query);
            setPage(1);
            clearSelection();
          }}
          filterActive={filterActive}
          onOpenFilter={() => setFilterSheetOpen(true)}
          onClearFilter={() => {
            setListFilter(EMPTY_ISSUES_LIST_FILTER);
            setPage(1);
            clearSelection();
          }}
          dateRange={dateRange}
          onDateRangeChange={(range) => {
            setDateRange(range);
            setPage(1);
            clearSelection();
          }}
        />

        <IssuesListBulkActions
          selectedNumbers={selectedNumbersList}
          locale={locale}
          onClearSelection={clearSelection}
          onStatusUpdated={handleBulkStatusUpdated}
        />

        {!hasIssues ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">{t("admin.empty")}</p>
          </div>
        ) : !hasFilteredResults ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {hasActiveQuery ? t("list.noSearchResults") : t("admin.empty")}
            </p>
          </div>
        ) : (
          <IssuesListTable
            issues={pageIssues}
            locale={locale}
            issuesVariant={issuesVariant}
            selectedNumbers={selectedNumbers}
            onToggleIssue={toggleIssueSelection}
            onTogglePage={togglePageSelection}
            pageSelectionState={pageSelectionState}
            footer={
              <PaginationControls
                className="px-4 pb-4"
                page={safePage}
                pageSize={pageSize}
                totalCount={totalCount}
                totalPages={totalPages}
                hasPreviousPage={safePage > 1}
                hasNextPage={safePage < totalPages}
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                  clearSelection();
                }}
                onPageSizeChange={(nextPageSize) => {
                  setPageSize(nextPageSize);
                  setPage(1);
                  clearSelection();
                }}
              />
            }
          />
        )}
      </div>

      <IssuesListFilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        issues={issuesList}
        searchQuery={searchQuery}
        appliedDateRange={dateRange}
        appliedFilter={listFilter}
        onApply={(filter) => {
          setListFilter(filter);
          setPage(1);
          clearSelection();
        }}
      />

      <ReportIssueDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        locale={locale}
        workspaceSlug={activeWorkspace?.slug ?? null}
        onSuccess={handleIssueCreated}
      />
    </div>
  );
}
