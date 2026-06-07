"use client";

import type { SectionData } from "./estimate-items-table";
import type { LineItemData } from "./estimate-line-item-row";
import { EstimateItemsTable } from "./estimate-items-table";
import { EstimateItemsMobileList } from "./estimate-items-mobile-list";
import { EstimateItemsToolbar } from "./estimate-items-toolbar";
import { EstimateMobileToolbar } from "./estimate-mobile-toolbar";
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
  onAddSection: () => void;
  showAiPanel: boolean;
  onToggleAiPanel: () => void;
  aiUsesSideLayout?: boolean;
  onTableSearchQueryChange: (query: string) => void;
  onUpdateSection: (sectionId: string, title: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddItem: (sectionId: string) => void;
  onUpdateItem: (itemId: string, data: Partial<Omit<LineItemData, "id" | "sortOrder">>) => void;
  onDeleteItem: (itemId: string) => void;
  onDuplicateItem: (sectionId: string, itemId: string) => void;
  onReorderItems: (sectionId: string, fromIndex: number, toIndex: number) => void;
  onBlur: () => void;
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
  showAiPanel,
  onToggleAiPanel,
  aiUsesSideLayout = false,
  onTableSearchQueryChange,
  onUpdateSection,
  onDeleteSection,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  onReorderItems,
  onBlur,
}: EstimateItemsViewProps) {
  return (
    <>
      <div className={estimateItemsDesktopClass}>
        <EstimateItemsToolbar
          advancedMode={advancedMode}
          onAdvancedModeChange={onAdvancedModeChange}
          marginPercent={marginPercent}
          onMarginChange={onMarginChange}
          onMarginBlur={onMarginBlur}
          onAddSection={onAddSection}
          showAiPanel={showAiPanel}
          onToggleAiPanel={onToggleAiPanel}
          aiUsesSideLayout={aiUsesSideLayout}
          tableSearchQuery={tableSearchQuery}
          onTableSearchQueryChange={onTableSearchQueryChange}
        />
        <EstimateItemsTable
          sections={sections}
          currency={currency}
          advancedMode={advancedMode}
          onUpdateSection={onUpdateSection}
          onDeleteSection={onDeleteSection}
          onAddItem={onAddItem}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          onReorderItems={onReorderItems}
          onBlur={onBlur}
          tableSearchQuery={tableSearchQuery}
        />
      </div>

      <div className={estimateItemsMobileClass}>
        <EstimateMobileToolbar
          advancedMode={advancedMode}
          onAdvancedModeChange={onAdvancedModeChange}
          marginPercent={marginPercent}
          onMarginChange={onMarginChange}
          onMarginBlur={onMarginBlur}
          tableSearchQuery={tableSearchQuery}
          onTableSearchQueryChange={onTableSearchQueryChange}
        />
        <EstimateItemsMobileList
          sections={sections}
          currency={currency}
          advancedMode={advancedMode}
          marginPercent={marginPercent}
          tableSearchQuery={tableSearchQuery}
          onUpdateSection={onUpdateSection}
          onDeleteSection={onDeleteSection}
          onAddItem={onAddItem}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          onDuplicateItem={onDuplicateItem}
          onBlur={onBlur}
        />
      </div>
    </>
  );
}
