"use client";

import { TemplateToolsMenu } from "./template-tools-menu";
import { estimateItemsToolbarMobileClass } from "@/features/estimates/lib/estimate-layout-config";

interface TemplateMobileToolbarProps {
  sectionsCount: number;
  itemsCount: number;
  advancedMode: boolean;
  onAdvancedModeChange: (value: boolean) => void;
}

export function TemplateMobileToolbar({
  sectionsCount,
  itemsCount,
  advancedMode,
  onAdvancedModeChange,
}: TemplateMobileToolbarProps) {
  return (
    <div
      className={`${estimateItemsToolbarMobileClass} flex items-center justify-between gap-2 border-b border-border/60 px-2 py-2`}
    >
      <p className="truncate text-xs text-muted-foreground">
        {sectionsCount} / {itemsCount}
      </p>
      <div className="flex shrink-0 items-center gap-1.5">
        <TemplateToolsMenu
          advancedMode={advancedMode}
          onAdvancedModeChange={onAdvancedModeChange}
        />
      </div>
    </div>
  );
}
