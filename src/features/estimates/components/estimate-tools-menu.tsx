"use client";

import { Maximize2, Minimize2, Percent, Settings, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import { DecimalInput } from "@/components/ui/decimal-input";
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
import { roundEstimateDecimal } from "@/features/estimates/lib/estimate-decimals";
import { cn } from "@/lib/utils";

interface EstimateToolsMenuProps {
  advancedMode: boolean;
  onAdvancedModeChange: (value: boolean) => void;
  marginPercent: number;
  onMarginChange: (value: number) => void;
  onMarginBlur: (value: number) => void;
  topPanelHidden?: boolean;
  onToggleTopPanel?: () => void;
  showTopPanelToggle?: boolean;
  triggerButtonClassName?: string;
}

const menuMarginInputClassName =
  "estimate-mobile-position-field m-0 h-7 w-12 border-none bg-transparent p-0 text-right text-sm tabular-nums shadow-none outline-none ring-0 focus:ring-0";

const defaultTriggerButtonClassName =
  "size-8 shrink-0 rounded-md border-blue-200 text-blue-600 shadow-xs hover:bg-blue-50 dark:border-input dark:text-foreground dark:hover:bg-accent";

export function EstimateToolsMenu({
  advancedMode,
  onAdvancedModeChange,
  marginPercent,
  onMarginChange,
  onMarginBlur,
  topPanelHidden = false,
  onToggleTopPanel,
  showTopPanelToggle = true,
  triggerButtonClassName,
}: EstimateToolsMenuProps) {
  const t = useTranslations("estimates");
  const tTopPanel = useTranslations("estimates.editor.topPanel");
  const modeValue = advancedMode ? "advanced" : "basic";

  const handleMarginBlur = () => {
    const num = roundEstimateDecimal(marginPercent);
    if (num < 0 || num > 100) {
      return;
    }
    if (num !== marginPercent) {
      onMarginChange(num);
    }
    onMarginBlur(num);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t("editor.mobile.toolsMenu")}
          className={cn(defaultTriggerButtonClassName, triggerButtonClassName)}
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
              className="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none"
              onPointerDown={(event) => event.preventDefault()}
              onClick={(event) => event.stopPropagation()}
            >
              <Percent className="size-4 text-muted-foreground" />
              <span className="min-w-0 flex-1">{t("profitability.projectMargin")}</span>
              <DecimalInput
                min={0}
                max={100}
                value={marginPercent}
                onValueChange={onMarginChange}
                onBlurCommit={handleMarginBlur}
                emptyZero={false}
                className={menuMarginInputClassName}
              />
              <span className="text-muted-foreground">{t("margin.unit")}</span>
            </div>
          </>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem disabled className="gap-2" title={t("editor.toolbar.comingSoon")}>
          <Upload className="size-4" />
          {t("editor.toolbar.importPriceList")}
        </DropdownMenuItem>

        {showTopPanelToggle && onToggleTopPanel ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onToggleTopPanel} className="gap-2">
              {topPanelHidden ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
              {topPanelHidden ? tTopPanel("show") : tTopPanel("hide")}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
