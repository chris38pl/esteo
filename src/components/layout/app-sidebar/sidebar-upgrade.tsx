"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebarLayout } from "./sidebar-layout-context";
import { useSidebarStore } from "./sidebar-store";

export function SidebarUpgrade({ collapsedOverride }: { collapsedOverride?: boolean } = {}) {
  const t = useTranslations("sidebar");
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t("upgrade.title")}
              className={cn(
                "group mx-auto flex size-9 items-center justify-center rounded-lg",
                "bg-primary/8 text-primary ring-1 ring-border/40",
                "transition hover:bg-primary/12 focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring/35",
              )}
            >
              <Sparkles className="size-4" strokeWidth={1.75} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{t("upgrade.title")}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={cn(
        "box-border w-full min-w-0 max-w-full rounded-lg border border-sidebar-border bg-[var(--sidebar-search)] px-2 py-2",
        inDrawer && "overflow-hidden",
      )}
    >
      <p className="text-[11px] font-medium leading-tight text-foreground">
        {t("upgrade.title")}
      </p>
      <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
        {t("upgrade.body")}
      </p>
      <Button type="button" size="sm" className="mt-2 h-7 w-full max-w-full min-w-0 rounded-md text-xs">
        {t("upgrade.cta")}
      </Button>
    </div>
  );
}
