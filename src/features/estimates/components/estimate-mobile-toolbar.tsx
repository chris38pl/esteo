"use client";

import type { SectionData } from "./estimate-items-table";
import { EstimateTableFilterButton } from "./estimate-table-filter-button";
import { EstimateTableSearch } from "./estimate-table-search";
import { EstimateMobileItemsStats } from "./estimate-mobile-items-stats";
import { EstimateToolsMenu } from "./estimate-tools-menu";
import { estimateItemsToolbarMobileClass } from "@/features/estimates/lib/estimate-layout-config";

interface EstimateMobileToolbarProps {
  sections: SectionData[];
  advancedMode: boolean;
  onAdvancedModeChange: (value: boolean) => void;
  marginPercent: number;
  onMarginChange: (value: number) => void;
  onMarginBlur: (value: number) => void;
  topPanelHidden: boolean;
  onToggleTopPanel: () => void;
  tableSearchQuery: string;
  onTableSearchQueryChange: (query: string) => void;
  filterActive: boolean;
  onOpenFilter: () => void;
  onClearFilter: () => void;
}

export function EstimateMobileToolbar({
  sections,
  advancedMode,
  onAdvancedModeChange,
  marginPercent,
  onMarginChange,
  onMarginBlur,
  topPanelHidden,
  onToggleTopPanel,
  tableSearchQuery,
  onTableSearchQueryChange,
  filterActive,
  onOpenFilter,
  onClearFilter,
}: EstimateMobileToolbarProps) {
  return (
    <div
      className={`${estimateItemsToolbarMobileClass} flex items-center justify-between gap-2 border-b border-border/60 px-2 py-2`}
    >
      <EstimateMobileItemsStats
        sections={sections}
        advancedMode={advancedMode}
        marginPercent={marginPercent}
      />
      <div className="flex shrink-0 items-center gap-1.5">
        <EstimateTableSearch
          query={tableSearchQuery}
          onQueryChange={onTableSearchQueryChange}
        />
        <EstimateTableFilterButton
          active={filterActive}
          onClick={onOpenFilter}
          onClear={onClearFilter}
          className="size-8"
        />
        <EstimateToolsMenu
          advancedMode={advancedMode}
          onAdvancedModeChange={onAdvancedModeChange}
          marginPercent={marginPercent}
          onMarginChange={onMarginChange}
          onMarginBlur={onMarginBlur}
          topPanelHidden={topPanelHidden}
          onToggleTopPanel={onToggleTopPanel}
        />
      </div>
    </div>
  );
}
