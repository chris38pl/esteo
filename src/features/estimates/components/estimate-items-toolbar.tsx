"use client";

import { Bot, Filter, Plus, Search, Settings, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { EstimateMarginControl } from "./estimate-margin-control";
import { EstimateEditorModeSelect } from "./estimate-editor-mode-select";
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
  onAddSection: () => void;
  showAiPanel: boolean;
  onToggleAiPanel: () => void;
  /** Side-column AI (toolbar toggle); false = floating FAB only */
  aiUsesSideLayout?: boolean;
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
        <Button
          variant="outline"
          size="sm"
          className={estimateOutlineButtonClassName}
          disabled
          title={t("editor.toolbar.comingSoon")}
        >
          <Upload className="size-4" />
          {t("editor.toolbar.importPriceList")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {advancedMode ? (
          <EstimateMarginControl
            marginPercent={marginPercent}
            onChange={onMarginChange}
            onBlur={onMarginBlur}
          />
        ) : null}
        <EstimateEditorModeSelect
          advancedMode={advancedMode}
          onModeChange={onAdvancedModeChange}
        />
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
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0 rounded-md border-blue-200 text-blue-600 shadow-xs hover:bg-blue-50 dark:border-input dark:text-foreground dark:hover:bg-accent"
          disabled
          aria-label={t("editor.toolbar.search")}
          title={t("editor.toolbar.comingSoon")}
        >
          <Search className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0 rounded-md border-blue-200 text-blue-600 shadow-xs hover:bg-blue-50 dark:border-input dark:text-foreground dark:hover:bg-accent"
          disabled
          aria-label={t("editor.toolbar.filter")}
          title={t("editor.toolbar.comingSoon")}
        >
          <Filter className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0 rounded-md border-blue-200 text-blue-600 shadow-xs hover:bg-blue-50 dark:border-input dark:text-foreground dark:hover:bg-accent"
          disabled
          aria-label={t("editor.toolbar.settings")}
          title={t("editor.toolbar.comingSoon")}
        >
          <Settings className="size-4" />
        </Button>
      </div>
    </div>
  );
}
