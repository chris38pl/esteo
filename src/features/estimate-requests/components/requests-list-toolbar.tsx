"use client";

import { Filter, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { estimateOutlineButtonClassName } from "@/features/estimates/components/estimate-action-button-styles";
import type { RequestListDateRange } from "@/features/estimate-requests/lib/requests-list-filter";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { RequestsListDateRangePicker } from "./requests-list-date-range-picker";

interface RequestsListToolbarProps {
  locale: Locale;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  filterActive: boolean;
  onOpenFilter: () => void;
  onClearFilter: () => void;
  dateRange: RequestListDateRange;
  onDateRangeChange: (range: RequestListDateRange) => void;
}

export function RequestsListToolbar({
  locale,
  searchQuery,
  onSearchQueryChange,
  filterActive,
  onOpenFilter,
  onClearFilter,
  dateRange,
  onDateRangeChange,
}: RequestsListToolbarProps) {
  const t = useTranslations("requests");

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border/60 p-4">
      <div className="relative min-w-[10rem] w-full max-w-md flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder={t("list.searchPlaceholder")}
          className="h-10 w-full rounded-lg border-border/70 bg-background pl-9 shadow-xs"
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="relative shrink-0">
          <Button
            type="button"
            variant={filterActive ? "default" : "outline"}
            size="icon"
            aria-label={t("list.toolbar.filters")}
            className={cn(
              "size-9 shrink-0 rounded-md px-0 shadow-xs max-sm:min-w-9 sm:h-8 sm:min-h-9 sm:w-auto sm:min-w-[7.25rem] sm:px-3",
              !filterActive && estimateOutlineButtonClassName,
              filterActive &&
                "border-primary bg-primary text-primary-foreground hover:bg-primary/90 dark:border-primary dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 [&_svg]:text-primary-foreground",
            )}
            onClick={onOpenFilter}
          >
            <Filter className="size-4" />
            <span className="hidden sm:inline">{t("list.toolbar.filters")}</span>
          </Button>

          {filterActive ? (
            <button
              type="button"
              className="absolute -right-0.5 -bottom-0.5 z-10 flex size-3.5 cursor-pointer items-center justify-center rounded-full border border-primary bg-primary-foreground text-primary shadow-sm transition-colors hover:bg-primary-foreground/90 dark:border-primary-foreground dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
              aria-label={t("list.filter.clear")}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onClearFilter();
              }}
            >
              <X className="size-2.5" strokeWidth={2.5} />
            </button>
          ) : null}
        </div>

        <RequestsListDateRangePicker
          locale={locale}
          value={dateRange}
          onChange={onDateRangeChange}
        />
      </div>
    </div>
  );
}
