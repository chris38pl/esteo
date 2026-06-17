"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { IssuesListFilterSheet } from "@/features/issues/components/issues-list-filter-sheet";
import { IssuesListHeroCard } from "@/features/issues/components/issues-list-hero-card";
import { IssuesListTable } from "@/features/issues/components/issues-list-table";
import { IssuesListToolbar } from "@/features/issues/components/issues-list-toolbar";
import {
  ReportIssueDialog,
  type CreatedIssueSummary,
} from "@/features/issues/components/report-issue-dialog";
import {
  EMPTY_ISSUES_LIST_DATE_RANGE,
  EMPTY_ISSUES_LIST_FILTER,
  hasActiveIssuesDateRange,
  hasActiveIssuesListFilters,
  issueIsVisible,
} from "@/features/issues/lib/issues-list-filter";
import { issuesListMaxWidthClass } from "@/features/issues/lib/issues-layout";
import type { AdminIssueListItem } from "@/features/issues/server/repository";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const DEFAULT_PAGE_SIZE = 10;

export function AdminIssuesListPanel({
  issues,
  locale,
}: {
  issues: AdminIssueListItem[];
  locale: Locale;
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

  useEffect(() => {
    setIssuesList(issues);
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
          }}
          filterActive={filterActive}
          onOpenFilter={() => setFilterSheetOpen(true)}
          onClearFilter={() => {
            setListFilter(EMPTY_ISSUES_LIST_FILTER);
            setPage(1);
          }}
          dateRange={dateRange}
          onDateRangeChange={(range) => {
            setDateRange(range);
            setPage(1);
          }}
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
