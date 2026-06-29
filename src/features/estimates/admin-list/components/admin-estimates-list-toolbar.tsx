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
import { AdminEstimatesWorkspaceFilter } from "@/features/estimates/admin-list/components/admin-estimates-workspace-filter";
import { estimateOutlineButtonClassName } from "@/features/estimates/components/estimate-action-button-styles";
import { EstimatesListDateRangePicker } from "@/features/estimates/components/estimates-list-date-range-picker";
import { EstimatesListViewSettings } from "@/features/estimates/components/estimates-list-view-settings";
import type {
  EstimatesListPageSize,
  EstimatesListPreferences,
  OptionalColumnId,
} from "@/features/estimates/hooks/use-estimates-list-preferences";
import type { EstimateListDateRange } from "@/features/estimates/lib/estimate-list-filter";
import type { AdminEstimateWorkspaceFilterOption } from "@/features/estimates/server/admin-estimates";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface AdminEstimatesListToolbarProps {
  locale: Locale;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  filterActive: boolean;
  onOpenFilter: () => void;
  onClearFilter: () => void;
  dateRange: EstimateListDateRange;
  onDateRangeChange: (range: EstimateListDateRange) => void;
  workspaceOptions: AdminEstimateWorkspaceFilterOption[];
  workspaceId: string | null;
  onWorkspaceChange: (workspaceId: string | null) => void;
  preferences: EstimatesListPreferences;
  onToggleColumn: (id: OptionalColumnId, visible: boolean) => void;
  onPageSizeChange: (pageSize: EstimatesListPageSize) => void;
  onExportCsv: () => void;
  canExportCsv: boolean;
}

export function AdminEstimatesListToolbar({
  locale,
  searchQuery,
  onSearchQueryChange,
  filterActive,
  onOpenFilter,
  onClearFilter,
  dateRange,
  onDateRangeChange,
  workspaceOptions,
  workspaceId,
  onWorkspaceChange,
  preferences,
  onToggleColumn,
  onPageSizeChange,
  onExportCsv,
  canExportCsv,
}: AdminEstimatesListToolbarProps) {
  const tEstimates = useTranslations("estimates");
  const tAdmin = useTranslations("admin.estimates");

  return (
    <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center">
      <AdminEstimatesWorkspaceFilter
        options={workspaceOptions}
        value={workspaceId}
        onChange={onWorkspaceChange}
      />

      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder={tAdmin("searchPlaceholder")}
          className="h-10 w-full rounded-lg border-border/70 bg-background pl-9 shadow-xs"
        />
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="relative shrink-0">
          <Button
            type="button"
            variant={filterActive ? "default" : "outline"}
            size="icon"
            aria-label={tEstimates("list.toolbar.filters")}
            className={cn(
              "size-9 shrink-0 rounded-md px-0 shadow-xs sm:h-8 sm:min-h-9 sm:w-auto sm:min-w-[7.25rem] sm:px-3",
              !filterActive && estimateOutlineButtonClassName,
              filterActive &&
                "border-primary bg-primary text-primary-foreground hover:bg-primary/90 dark:border-primary dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 [&_svg]:text-primary-foreground",
            )}
            onClick={onOpenFilter}
          >
            <Filter className="size-4" />
            <span className="hidden sm:inline">{tEstimates("list.toolbar.filters")}</span>
          </Button>

          {filterActive ? (
            <button
              type="button"
              className="absolute -right-0.5 -bottom-0.5 z-10 flex size-3.5 cursor-pointer items-center justify-center rounded-full border border-primary bg-primary-foreground text-primary shadow-sm transition-colors hover:bg-primary-foreground/90 dark:border-primary-foreground dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
              aria-label={tEstimates("list.filter.clear")}
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
                {tEstimates("list.toolbar.export")}
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onExportCsv} disabled={!canExportCsv}>
                {tEstimates("list.toolbar.exportCsv")}
              </DropdownMenuItem>
              <DropdownMenuItem disabled>{tEstimates("list.toolbar.exportExcel")}</DropdownMenuItem>
              <DropdownMenuItem disabled>{tEstimates("list.toolbar.exportPdf")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 shrink-0 rounded-md border-blue-200 text-blue-600 shadow-xs hover:bg-blue-50 dark:border-input dark:text-foreground dark:hover:bg-accent"
                aria-label={tEstimates("list.toolbar.viewSettings")}
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
