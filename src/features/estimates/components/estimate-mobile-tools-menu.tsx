"use client";

import { Settings, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EstimateMarginControl } from "./estimate-margin-control";

interface EstimateMobileToolsMenuProps {
  advancedMode: boolean;
  onAdvancedModeChange: (value: boolean) => void;
  marginPercent: number;
  onMarginChange: (value: number) => void;
  onMarginBlur: (value: number) => void;
  topPanelHidden: boolean;
  onToggleTopPanel: () => void;
}

export function EstimateMobileToolsMenu({
  advancedMode,
  onAdvancedModeChange,
  marginPercent,
  onMarginChange,
  onMarginBlur,
  topPanelHidden,
  onToggleTopPanel,
}: EstimateMobileToolsMenuProps) {
  const t = useTranslations("estimates");
  const modeValue = advancedMode ? "advanced" : "basic";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t("editor.mobile.toolsMenu")}
          className="size-8 shrink-0 rounded-md border-blue-200 text-blue-600 shadow-xs hover:bg-blue-50 dark:border-input dark:text-foreground dark:hover:bg-accent"
        >
          <Settings className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          {t("editor.mobile.toolsMenu")}
        </DropdownMenuLabel>
        <DropdownMenuLabel className="pt-1 text-[11px] font-medium text-muted-foreground/80">
          {t("editor.mobile.viewMode")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={modeValue}
          onValueChange={(next) => onAdvancedModeChange(next === "advanced")}
        >
          <DropdownMenuRadioItem value="basic" className="gap-2">
            {t("editor.mobile.basicView")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="advanced" className="gap-2">
            {t("editor.mobile.advancedView")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        {advancedMode ? (
          <>
            <DropdownMenuSeparator />
            <div
              className="px-2 py-2"
              onPointerDown={(event) => event.preventDefault()}
              onClick={(event) => event.stopPropagation()}
            >
              <EstimateMarginControl
                marginPercent={marginPercent}
                onChange={onMarginChange}
                onBlur={onMarginBlur}
                className="h-9 min-h-9 w-full px-3"
              />
            </div>
          </>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem disabled className="gap-2" title={t("editor.toolbar.comingSoon")}>
          <Upload className="size-4" />
          {t("editor.toolbar.importPriceList")}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onToggleTopPanel} className="gap-2">
          {topPanelHidden ? t("editor.topPanel.show") : t("editor.topPanel.hide")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
