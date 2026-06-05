"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type EstimateEditorTabId =
  | "items"
  | "summary"
  | "attachments"
  | "history"
  | "payments"
  | "notes";

interface EstimateEditorTabsProps {
  activeTab: EstimateEditorTabId;
  onTabChange: (tab: EstimateEditorTabId) => void;
  attachmentsCount?: number;
  topPanelHidden?: boolean;
  onToggleTopPanel?: () => void;
}

const TAB_IDS: EstimateEditorTabId[] = [
  "items",
  "summary",
  "attachments",
  "history",
  "payments",
  "notes",
];

export function EstimateEditorTabs({
  activeTab,
  onTabChange,
  attachmentsCount = 0,
  topPanelHidden = false,
  onToggleTopPanel,
}: EstimateEditorTabsProps) {
  const t = useTranslations("estimates");

  return (
    <div className="flex items-stretch border-b border-border/60">
      <div
        className="flex min-w-0 flex-1 gap-0 overflow-x-auto"
        role="tablist"
        aria-label={t("editor.tabs.ariaLabel")}
      >
      {TAB_IDS.map((tabId) => {
        const isActive = activeTab === tabId;
        const label =
          tabId === "attachments"
            ? t("editor.tabs.attachments", { count: attachmentsCount })
            : t(`editor.tabs.${tabId}` as "editor.tabs.items");

        return (
          <button
            key={tabId}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tabId)}
            className={cn(
              "relative shrink-0 px-4 py-3 text-sm font-medium transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            {isActive ? (
              <span
                className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
      </div>

      {onToggleTopPanel ? (
        <div className="flex shrink-0 items-center border-l border-border/60 px-2">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={onToggleTopPanel}
                  aria-pressed={topPanelHidden}
                  aria-label={
                    topPanelHidden
                      ? t("editor.topPanel.show")
                      : t("editor.topPanel.hide")
                  }
                >
                  {topPanelHidden ? (
                    <Minimize2 className="size-4" />
                  ) : (
                    <Maximize2 className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {topPanelHidden
                  ? t("editor.topPanel.show")
                  : t("editor.topPanel.hide")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ) : null}
    </div>
  );
}
