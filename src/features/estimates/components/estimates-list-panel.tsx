"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { PaginationControls } from "@/components/shared/pagination-controls";
import { Button } from "@/components/ui/button";
import { estimateEditorMaxWidthClass } from "@/features/estimates/lib/estimate-layout-config";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { CreateEstimateModal } from "./create-estimate-modal";
import { EstimateEditorLayoutStyles } from "./estimate-editor-layout-styles";
import { EstimatesListHeroCards } from "./estimates-list-hero-cards";
import { EstimatesListStatsCards } from "./estimates-list-stats-cards";
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

const DEFAULT_PAGE_SIZE = 10;

function matchesSearch(estimate: EstimateListPageItem, query: string): boolean {
  const ctx = estimate.listContext;
  const request = estimate.estimateRequest;
  const haystack = [
    estimate.title,
    request?.requestNumber,
    ctx.customerName,
    ctx.customerEmail,
    ctx.investmentPropertyType,
    ctx.investmentStreet,
    ctx.investmentCity,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function EstimatesListPanel({
  estimates,
  createFormData,
  workspaceId,
  workspaceSlug,
  locale,
}: EstimatesListPanelProps) {
  const t = useTranslations("estimates");
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const filteredEstimates = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const list = normalizedQuery
      ? estimates.filter((estimate) => matchesSearch(estimate, normalizedQuery))
      : [...estimates];

    list.sort((a, b) => {
      const aDate = a.latestVersion?.updatedAt ?? a.createdAt;
      const bDate = b.latestVersion?.updatedAt ?? b.createdAt;
      return bDate.getTime() - aDate.getTime();
    });

    return list;
  }, [estimates, searchQuery]);

  const totalCount = filteredEstimates.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageEstimates = filteredEstimates.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const hasEstimates = estimates.length > 0;
  const hasFilteredResults = filteredEstimates.length > 0;

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
        <EstimatesListToolbar searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />

        {!hasEstimates ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">{t("page.empty")}</p>
            <Button variant="outline" onClick={() => setCreateOpen(true)}>
              {t("page.createFirst")}
            </Button>
          </div>
        ) : !hasFilteredResults ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">{t("list.noSearchResults")}</p>
          </div>
        ) : (
          <EstimatesListTable
            estimates={pageEstimates}
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
