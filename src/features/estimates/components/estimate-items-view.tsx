"use client";

import { useEffect, useState } from "react";

import type { SectionData } from "./estimate-items-table";
import type { LineItemData } from "./estimate-line-item-row";
import { EstimateItemsTable } from "./estimate-items-table";
import { EstimateItemsMobileList } from "./estimate-items-mobile-list";
import { EstimateItemsToolbar } from "./estimate-items-toolbar";
import { EstimateItemsFilterSheet } from "./estimate-items-filter-sheet";
import { EstimateMobileToolbar } from "./estimate-mobile-toolbar";
import {
  EMPTY_ESTIMATE_ITEMS_FILTER,
  hasActiveFilters,
  sanitizeFilterForMode,
  type EstimateItemsFilterState,
} from "@/features/estimates/lib/estimate-item-filter";
import type { AutoSaveStatus } from "@/features/estimates/hooks/use-estimate-autosave";
import {
  estimateItemsDesktopClass,
  estimateItemsMobileClass,
} from "@/features/estimates/lib/estimate-layout-config";

interface EstimateItemsViewProps {
  sections: SectionData[];
  currency: string;
  advancedMode: boolean;
  marginPercent: number;
  tableSearchQuery: string;
  onAdvancedModeChange: (value: boolean) => void;
  onMarginChange: (value: number) => void;
  onMarginBlur: (value: number) => void;
  onAddSection: () => void | Promise<string | undefined>;
  isAddingSection?: boolean;
  addingItemSectionIds?: string[];
  autosaveStatus?: AutoSaveStatus;
  showAiPanel: boolean;
  onToggleAiPanel: () => void;
  aiUsesSideLayout?: boolean;
  onTableSearchQueryChange: (query: string) => void;
  onUpdateSection: (sectionId: string, title: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddItem: (sectionId: string) => void;
  onUpdateItem: (itemId: string, data: Partial<Omit<LineItemData, "id" | "sortOrder">>) => void;
  onPersistItem: (
    itemId: string,
    data: Partial<Omit<LineItemData, "id" | "sortOrder">>,
  ) => Promise<void>;
  onDeleteItem: (itemId: string) => void;
  onDuplicateItem: (sectionId: string, itemId: string) => void;
  onReorderItems: (sectionId: string, fromIndex: number, toIndex: number) => void;
  onBlur: () => void | Promise<void>;
  topPanelHidden: boolean;
  onToggleTopPanel: () => void;
  onMobilePositionSheetOpenChange?: (open: boolean) => void;
  readOnly?: boolean;
}

export function EstimateItemsView({
  sections,
  currency,
  advancedMode,
  marginPercent,
  tableSearchQuery,
  onAdvancedModeChange,
  onMarginChange,
  onMarginBlur,
  onAddSection,
  isAddingSection = false,
  addingItemSectionIds = [],
  autosaveStatus = "idle",
  showAiPanel,
  onToggleAiPanel,
  aiUsesSideLayout = false,
  onTableSearchQueryChange,
  onUpdateSection,
  onDeleteSection,
  onAddItem,
  onUpdateItem,
  onPersistItem,
  onDeleteItem,
  onDuplicateItem,
  onReorderItems,
  onBlur,
  topPanelHidden,
  onToggleTopPanel,
  onMobilePositionSheetOpenChange,
  readOnly = false,
}: EstimateItemsViewProps) {
  const [tableFilter, setTableFilter] = useState<EstimateItemsFilterState>(
    EMPTY_ESTIMATE_ITEMS_FILTER,
  );
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [scrollToSectionId, setScrollToSectionId] = useState<string | null>(null);
  const filterActive = hasActiveFilters(tableFilter);

  const handleDesktopAddSection = async () => {
    const sectionId = await onAddSection();
    if (sectionId) {
      setScrollToSectionId(sectionId);
    }
  };

  useEffect(() => {
    setTableFilter((prev) => sanitizeFilterForMode(prev, advancedMode));
  }, [advancedMode]);

  const applyTableFilter = (filter: EstimateItemsFilterState) => {
    setTableFilter(sanitizeFilterForMode(filter, advancedMode));
  };

  return (
    <>
      <div className={estimateItemsDesktopClass}>
        <EstimateItemsToolbar
          advancedMode={advancedMode}
          onAdvancedModeChange={onAdvancedModeChange}
          marginPercent={marginPercent}
          onMarginChange={onMarginChange}
          onMarginBlur={onMarginBlur}
          onAddSection={handleDesktopAddSection}
          isAddingSection={isAddingSection}
          readOnly={readOnly}
          showAiPanel={showAiPanel}
          onToggleAiPanel={onToggleAiPanel}
          aiUsesSideLayout={aiUsesSideLayout}
          tableSearchQuery={tableSearchQuery}
          onTableSearchQueryChange={onTableSearchQueryChange}
          filterActive={filterActive}
          onOpenFilter={() => setFilterSheetOpen(true)}
          onClearFilter={() => setTableFilter(EMPTY_ESTIMATE_ITEMS_FILTER)}
        />
        <EstimateItemsTable
          sections={sections}
          currency={currency}
          advancedMode={advancedMode}
          readOnly={readOnly}
          onUpdateSection={onUpdateSection}
          onDeleteSection={onDeleteSection}
          onAddItem={onAddItem}
          addingItemSectionIds={addingItemSectionIds}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          onReorderItems={onReorderItems}
          onBlur={onBlur}
          tableSearchQuery={tableSearchQuery}
          tableFilter={tableFilter}
          scrollToSectionId={scrollToSectionId}
          onScrollToSectionHandled={() => setScrollToSectionId(null)}
        />
      </div>

      <div className={estimateItemsMobileClass}>
        <EstimateMobileToolbar
          sections={sections}
          advancedMode={advancedMode}
          onAdvancedModeChange={onAdvancedModeChange}
          marginPercent={marginPercent}
          onMarginChange={onMarginChange}
          onMarginBlur={onMarginBlur}
          readOnly={readOnly}
          topPanelHidden={topPanelHidden}
          onToggleTopPanel={onToggleTopPanel}
          tableSearchQuery={tableSearchQuery}
          onTableSearchQueryChange={onTableSearchQueryChange}
          filterActive={filterActive}
          onOpenFilter={() => setFilterSheetOpen(true)}
          onClearFilter={() => setTableFilter(EMPTY_ESTIMATE_ITEMS_FILTER)}
        />
        <EstimateItemsMobileList
          sections={sections}
          currency={currency}
          advancedMode={advancedMode}
          marginPercent={marginPercent}
          tableSearchQuery={tableSearchQuery}
          tableFilter={tableFilter}
          readOnly={readOnly}
          onAddSection={onAddSection}
          isAddingSection={isAddingSection}
          addingItemSectionIds={addingItemSectionIds}
          autosaveStatus={autosaveStatus}
          onUpdateSection={onUpdateSection}
          onDeleteSection={onDeleteSection}
          onAddItem={onAddItem}
          onUpdateItem={onUpdateItem}
          onPersistItem={onPersistItem}
          onDeleteItem={onDeleteItem}
          onDuplicateItem={onDuplicateItem}
          onBlur={onBlur}
          onPositionSheetOpenChange={onMobilePositionSheetOpenChange}
        />
      </div>

      <EstimateItemsFilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        sections={sections}
        advancedMode={advancedMode}
        searchQuery={tableSearchQuery}
        appliedFilter={tableFilter}
        onApply={applyTableFilter}
      />
    </>
  );
}
