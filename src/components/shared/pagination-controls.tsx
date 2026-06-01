"use client";

import { useId, useMemo } from "react";
import { useTranslations } from "next-intl";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { getPageNumbers } from "@/lib/pagination";

type PaginationControlsProps = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  isLoading?: boolean;
  compact?: boolean;
  className?: string;
};

export function PaginationControls({
  page,
  pageSize,
  totalCount,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  isLoading = false,
  compact = false,
  className,
}: PaginationControlsProps) {
  const t = useTranslations("common");
  const selectId = useId();

  const { from, to } = useMemo(() => {
    if (totalCount === 0) {
      return { from: 0, to: 0 };
    }
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, totalCount);
    return { from, to };
  }, [page, pageSize, totalCount]);

  const tokens = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);

  if (totalCount === 0 || totalPages <= 1) {
    return null;
  }

  const summary = t("pagination.showing", { from, to, total: totalCount });

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="text-sm text-muted-foreground" aria-live="polite">
        {summary}
      </div>

      {compact ? (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-md border border-border/60 px-3 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50",
            )}
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPreviousPage || isLoading}
            aria-label={t("pagination.previous")}
          >
            {t("pagination.previous")}
          </button>
          <span className="text-sm text-muted-foreground">
            {t("pagination.pageOf", { page, totalPages })}
          </span>
          <button
            type="button"
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-md border border-border/60 px-3 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50",
            )}
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage || isLoading}
            aria-label={t("pagination.next")}
          >
            {t("pagination.next")}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:justify-end">
          {onPageSizeChange ? (
            <label
              htmlFor={selectId}
              className="flex shrink-0 items-center gap-2 text-sm whitespace-nowrap text-muted-foreground"
            >
              <span className="whitespace-nowrap">{t("pagination.rowsPerPage")}</span>
              <select
                id={selectId}
                value={pageSize}
                disabled={isLoading}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-9 shrink-0 rounded-md border border-border/60 bg-background px-2 text-sm text-foreground shadow-xs outline-none disabled:opacity-50"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <Pagination className="mx-0 w-auto shrink-0" aria-label={t("pagination.label")}>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  disabled={!hasPreviousPage || isLoading}
                  aria-label={t("pagination.previous")}
                  onClick={() => onPageChange(page - 1)}
                />
              </PaginationItem>

              {tokens.map((token, idx) => {
                if (token === "ellipsis") {
                  return (
                    <PaginationItem key={`e-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                const isActive = token === page;
                return (
                  <PaginationItem key={token}>
                    <PaginationLink
                      isActive={isActive}
                      disabled={isLoading}
                      onClick={() => onPageChange(token)}
                      aria-label={t("pagination.goToPage", { page: token })}
                    >
                      {token}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  disabled={!hasNextPage || isLoading}
                  aria-label={t("pagination.next")}
                  onClick={() => onPageChange(page + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

