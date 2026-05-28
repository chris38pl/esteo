"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { sidebarInsetClass } from "./sidebar-layout";
import { useSidebarLayout } from "./sidebar-layout-context";
import { useSidebarStore } from "./sidebar-store";

export function SidebarSearch({
  collapsedOverride,
}: {
  collapsedOverride?: boolean;
} = {}) {
  const t = useTranslations("sidebar");
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();

  if (collapsed) {
    return (
      <div className={cn(sidebarInsetClass(true, inDrawer), "pb-3 pt-2")}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={t("search.placeholder")}
                className={cn(
                  "sidebar-search-input mx-auto flex size-8 items-center justify-center rounded-lg",
                  "text-muted-foreground transition hover:bg-[var(--sidebar-nav-hover)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                )}
              >
                <Search className="size-3.5" strokeWidth={1.75} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{t("search.placeholder")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className={cn(sidebarInsetClass(false, inDrawer), "box-border pb-5 pt-3")}>
      <label className="relative box-border block w-full min-w-0 max-w-full px-2">
        <span className="sr-only">{t("search.placeholder")}</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-[var(--sidebar-section)]"
          strokeWidth={1.75}
        />
        <input
          type="search"
          readOnly
          placeholder={t("search.placeholder")}
          className={cn(
            "sidebar-search-input box-border block h-8 w-full max-w-full min-w-0 rounded-lg py-1.5 pr-2.5 pl-8 text-xs",
            "text-[var(--sidebar-heading)] placeholder:text-[var(--sidebar-section)]",
            "transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
          )}
        />
      </label>
    </div>
  );
}
