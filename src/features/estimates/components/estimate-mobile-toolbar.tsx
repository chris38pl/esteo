"use client";

import { useTranslations } from "next-intl";

import { EstimateEditorModeSelect } from "./estimate-editor-mode-select";
import { EstimateMarginControl } from "./estimate-margin-control";
import { EstimateTableSearch } from "./estimate-table-search";
import { estimateItemsToolbarMobileClass } from "@/features/estimates/lib/estimate-layout-config";

interface EstimateMobileToolbarProps {
  advancedMode: boolean;
  onAdvancedModeChange: (value: boolean) => void;
  marginPercent: number;
  onMarginChange: (value: number) => void;
  onMarginBlur: (value: number) => void;
  tableSearchQuery: string;
  onTableSearchQueryChange: (query: string) => void;
}

export function EstimateMobileToolbar({
  advancedMode,
  onAdvancedModeChange,
  marginPercent,
  onMarginChange,
  onMarginBlur,
  tableSearchQuery,
  onTableSearchQueryChange,
}: EstimateMobileToolbarProps) {
  const t = useTranslations("estimates");

  return (
    <div
      className={`${estimateItemsToolbarMobileClass} flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5`}
    >
      <EstimateEditorModeSelect
        advancedMode={advancedMode}
        onModeChange={onAdvancedModeChange}
      />
      <div className="flex items-center gap-2">
        {advancedMode ? (
          <EstimateMarginControl
            marginPercent={marginPercent}
            onChange={onMarginChange}
            onBlur={onMarginBlur}
          />
        ) : null}
        <EstimateTableSearch
          query={tableSearchQuery}
          onQueryChange={onTableSearchQueryChange}
        />
        <span className="sr-only">{t("editor.mobile.toolbarHint")}</span>
      </div>
    </div>
  );
}
