"use client";

import {
  Bot,
  ChevronDown,
  Filter,
  LayoutGrid,
  Plus,
  Search,
  Settings,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EstimateMarginControl } from "./estimate-margin-control";
import {
  estimateOutlineButtonClassName,
  estimatePrimaryButtonClassName,
} from "./estimate-action-button-styles";

interface EstimateItemsToolbarProps {
  marginPercent: number;
  onMarginChange: (value: number) => void;
  onMarginBlur: (value: number) => void;
  onAddSection: () => void;
  showAiPanel: boolean;
  onToggleAiPanel: () => void;
}

export function EstimateItemsToolbar({
  marginPercent,
  onMarginChange,
  onMarginBlur,
  onAddSection,
  showAiPanel,
  onToggleAiPanel,
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={estimateOutlineButtonClassName}
              disabled
              title={t("editor.toolbar.comingSoon")}
            >
              <LayoutGrid className="size-4" />
              {t("editor.toolbar.statements")}
              <ChevronDown className="size-3.5 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem disabled>
              {t("editor.toolbar.statements")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className={estimateOutlineButtonClassName}
          onClick={onToggleAiPanel}
        >
          <Bot className="size-4" />
          {showAiPanel ? t("editor.hideAi") : t("editor.aiAssistant")}
        </Button>
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
        <EstimateMarginControl
          marginPercent={marginPercent}
          onChange={onMarginChange}
          onBlur={onMarginBlur}
        />
      </div>
    </div>
  );
}
