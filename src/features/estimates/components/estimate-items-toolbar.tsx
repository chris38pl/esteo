"use client";

import { Bot, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { EstimateTableFilterButton } from "./estimate-table-filter-button";
import { EstimateTableSearch } from "./estimate-table-search";
import { EstimateToolsMenu } from "./estimate-tools-menu";
import {
  estimateOutlineButtonClassName,
  estimatePrimaryButtonClassName,
} from "./estimate-action-button-styles";

interface EstimateItemsToolbarProps {
  advancedMode: boolean;
  onAdvancedModeChange: (value: boolean) => void;
  marginPercent: number;
  onMarginChange: (value: number) => void;
  onMarginBlur: (value: number) => void;
  onAddSection: () => void | Promise<void>;
  showAiPanel: boolean;
  onToggleAiPanel: () => void;
  /** Side-column AI (toolbar toggle); false = floating FAB only */
  aiUsesSideLayout?: boolean;
  tableSearchQuery: string;
  onTableSearchQueryChange: (query: string) => void;
  filterActive: boolean;
  onOpenFilter: () => void;
  onClearFilter: () => void;
}

export function EstimateItemsToolbar({
  advancedMode,
  onAdvancedModeChange,
  marginPercent,
  onMarginChange,
  onMarginBlur,
  onAddSection,
  showAiPanel,
  onToggleAiPanel,
  aiUsesSideLayout = false,
  tableSearchQuery,
  onTableSearchQueryChange,
  filterActive,
  onOpenFilter,
  onClearFilter,
}: EstimateItemsToolbarProps) {
  const t = useTranslations("estimates");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          className={estimatePrimaryButtonClassName}
          onClick={onAddSection}
        >
          <Plus className="size-4" />
          {t("editor.addSection")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {aiUsesSideLayout ? (
          <Button
            variant="outline"
            size="sm"
            className={estimateOutlineButtonClassName}
            onClick={onToggleAiPanel}
          >
            <Bot className="size-4" />
            {showAiPanel ? t("editor.hideAi") : t("editor.aiAssistant")}
          </Button>
        ) : null}
        <EstimateTableSearch
          query={tableSearchQuery}
          onQueryChange={onTableSearchQueryChange}
        />
        <EstimateTableFilterButton
          active={filterActive}
          onClick={onOpenFilter}
          onClear={onClearFilter}
          className="size-9"
        />
        <EstimateToolsMenu
          advancedMode={advancedMode}
          onAdvancedModeChange={onAdvancedModeChange}
          marginPercent={marginPercent}
          onMarginChange={onMarginChange}
          onMarginBlur={onMarginBlur}
          showTopPanelToggle={false}
          triggerButtonClassName="size-9"
        />
      </div>
    </div>
  );
}
