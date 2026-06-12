"use client";

import { ChevronDown, Filter, Search, Settings, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type {
  EstimatesListPageSize,
  EstimatesListPreferences,
  OptionalColumnId,
} from "@/features/estimates/hooks/use-estimates-list-preferences";
import type { EstimateListDateRange } from "@/features/estimates/lib/estimate-list-filter";
import { EstimatesListDateRangePicker } from "./estimates-list-date-range-picker";
import { EstimatesListViewSettings } from "./estimates-list-view-settings";
import { estimateOutlineButtonClassName } from "./estimate-action-button-styles";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface EstimatesListToolbarProps {
  locale: Locale;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  filterActive: boolean;
  onOpenFilter: () => void;
  onClearFilter: () => void;
  dateRange: EstimateListDateRange;
  onDateRangeChange: (range: EstimateListDateRange) => void;
  preferences: EstimatesListPreferences;
  onToggleColumn: (id: OptionalColumnId, visible: boolean) => void;
  onPageSizeChange: (pageSize: EstimatesListPageSize) => void;
  onExportCsv: () => void;
  canExportCsv: boolean;
}

export function EstimatesListToolbar({
  locale,
  searchQuery,
  onSearchQueryChange,
  filterActive,
  onOpenFilter,
  onClearFilter,
  dateRange,
  onDateRangeChange,
  preferences,
  onToggleColumn,
  onPageSizeChange,
  onExportCsv,
  canExportCsv,
}: EstimatesListToolbarProps) {
  const t = useTranslations("estimates");

  return (
    <div className="flex items-center gap-2 border-b border-border/60 p-4">
      <div className="relative min-w-[10rem] flex-1 sm:min-w-[12rem]">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder={t("list.searchPlaceholder")}
          className="h-10 w-full min-w-[10rem] rounded-lg border-border/70 bg-background pl-9 shadow-xs sm:min-w-[12rem]"
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

        <EstimatesListDateRangePicker
          locale={locale}
          value={dateRange}
          onChange={onDateRangeChange}
        />
        <div className="hidden items-center gap-2 sm:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={estimateOutlineButtonClassName}
              >
                {t("list.toolbar.export")}
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onExportCsv} disabled={!canExportCsv}>
                {t("list.toolbar.exportCsv")}
              </DropdownMenuItem>
              <DropdownMenuItem disabled>{t("list.toolbar.exportExcel")}</DropdownMenuItem>
              <DropdownMenuItem disabled>{t("list.toolbar.exportPdf")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 shrink-0 rounded-md border-blue-200 text-blue-600 shadow-xs hover:bg-blue-50 dark:border-input dark:text-foreground dark:hover:bg-accent"
                aria-label={t("list.toolbar.viewSettings")}
              >
                <Settings className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <EstimatesListViewSettings
                preferences={preferences}
                onToggleColumn={onToggleColumn}
                onPageSizeChange={onPageSizeChange}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
