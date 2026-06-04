"use client";

import { useTranslations } from "next-intl";

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
}: EstimateEditorTabsProps) {
  const t = useTranslations("estimates");

  return (
    <div
      className="flex gap-0 overflow-x-auto border-b border-border/60"
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
  );
}
