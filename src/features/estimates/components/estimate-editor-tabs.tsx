"use client";

import { Ellipsis, Maximize2, Minimize2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  estimateEditorTabsDesktopClass,
  estimateEditorTabsExpandDesktopClass,
  estimateEditorTabsMobileClass,
} from "@/features/estimates/lib/estimate-layout-config";
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

const MOBILE_PRIMARY_TAB_IDS: EstimateEditorTabId[] = ["items", "summary", "attachments"];
const MOBILE_OVERFLOW_TAB_IDS: EstimateEditorTabId[] = ["history", "payments", "notes"];

function TabButton({
  tabId,
  isActive,
  label,
  onSelect,
  compact = false,
}: {
  tabId: EstimateEditorTabId;
  isActive: boolean;
  label: string;
  onSelect: (tabId: EstimateEditorTabId) => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => onSelect(tabId)}
      className={cn(
        "relative min-w-0 transition-colors",
        compact ? "flex-1 px-2 py-3 text-xs font-medium" : "shrink-0 px-4 py-3 text-sm font-medium",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span className="block truncate">{label}</span>
      {isActive ? (
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" aria-hidden />
      ) : null}
    </button>
  );
}

export function EstimateEditorTabs({
  activeTab,
  onTabChange,
  attachmentsCount = 0,
  topPanelHidden = false,
  onToggleTopPanel,
}: EstimateEditorTabsProps) {
  const t = useTranslations("estimates");
  const overflowTabActive = MOBILE_OVERFLOW_TAB_IDS.includes(activeTab);

  return (
    <div className="flex items-stretch border-b border-border/60">
      <div className={estimateEditorTabsDesktopClass}>
        <div
          className="flex min-w-0 flex-1 gap-0 overflow-x-auto"
          role="tablist"
          aria-label={t("editor.tabs.ariaLabel")}
        >
          {TAB_IDS.map((tabId) => {
            const label =
              tabId === "attachments"
                ? t("editor.tabs.attachments", { count: attachmentsCount })
                : t(`editor.tabs.${tabId}` as "editor.tabs.items");
            return (
              <TabButton
                key={tabId}
                tabId={tabId}
                isActive={activeTab === tabId}
                label={label}
                onSelect={onTabChange}
              />
            );
          })}
        </div>
      </div>

      <div
        className={cn(estimateEditorTabsMobileClass, "flex min-w-0 flex-1 items-stretch")}
        role="tablist"
        aria-label={t("editor.tabs.ariaLabel")}
      >
        {MOBILE_PRIMARY_TAB_IDS.map((tabId) => {
          const label =
            tabId === "attachments"
              ? t("editor.tabs.attachments", { count: attachmentsCount })
              : t(`editor.tabs.${tabId}` as "editor.tabs.items");
          return (
            <TabButton
              key={tabId}
              tabId={tabId}
              isActive={activeTab === tabId}
              label={label}
              onSelect={onTabChange}
              compact
            />
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              role="tab"
              aria-selected={overflowTabActive}
              className={cn(
                "relative flex shrink-0 items-center justify-center px-3 py-3 transition-colors",
                overflowTabActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={t("editor.tabs.more")}
            >
              <Ellipsis className="size-4" />
              {overflowTabActive ? (
                <span className="absolute inset-x-1 bottom-0 h-0.5 bg-primary" aria-hidden />
              ) : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {MOBILE_OVERFLOW_TAB_IDS.map((tabId) => {
              const label =
                tabId === "attachments"
                  ? t("editor.tabs.attachments", { count: attachmentsCount })
                  : t(`editor.tabs.${tabId}` as "editor.tabs.items");
              return (
                <DropdownMenuItem
                  key={tabId}
                  onClick={() => onTabChange(tabId)}
                  className={cn(activeTab === tabId && "font-medium text-primary")}
                >
                  {label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {onToggleTopPanel ? (
        <div
          className={cn(
            estimateEditorTabsExpandDesktopClass,
            "flex shrink-0 items-center border-l border-border/60 px-2",
          )}
        >
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
                    topPanelHidden ? t("editor.topPanel.show") : t("editor.topPanel.hide")
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
                {topPanelHidden ? t("editor.topPanel.show") : t("editor.topPanel.hide")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ) : null}
    </div>
  );
}
