"use client";

import Link from "next/link";
import { BadgeCheck, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebarLayout } from "./sidebar-layout-context";
import { useSidebarStore } from "./sidebar-store";

function upsellCopyKey(targetPlan: "PRO" | "BUSINESS"): "upgrade" | "upgradeBusiness" {
  return targetPlan === "BUSINESS" ? "upgradeBusiness" : "upgrade";
}

export function SidebarUpgrade({ collapsedOverride }: { collapsedOverride?: boolean } = {}) {
  const t = useTranslations("sidebar");
  const { billingSidebarState, locale } = useWorkspaceContext();
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();

  if (billingSidebarState.variant === "hidden") {
    return null;
  }

  if (billingSidebarState.variant === "status") {
    const tooltip = `${t("planStatus.businessTitle")} — ${t("planStatus.businessBody")}`;

    if (collapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={`/${locale}/dashboard/billing`}
                aria-label={tooltip}
                className={cn(
                  "group mx-auto flex size-9 items-center justify-center rounded-lg",
                  "bg-primary/8 text-primary ring-1 ring-border/40",
                  "transition hover:bg-primary/12 focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring/35",
                )}
              >
                <BadgeCheck className="size-4" strokeWidth={1.75} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{tooltip}</TooltipContent>
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
        <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
          {t("planStatus.businessTitle")}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
          {t("planStatus.businessBody")}
        </p>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="mt-2 h-7 w-full max-w-full min-w-0 rounded-md text-xs"
        >
          <Link href={`/${locale}/dashboard/billing`} className="relative">
            {t("planStatus.manageBilling")}
            <span className="ml-1.5 rounded bg-muted px-1 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("planStatus.soon")}
            </span>
          </Link>
        </Button>
      </div>
    );
  }

  const copyKey = upsellCopyKey(billingSidebarState.targetPlan);
  const upsellTitle = t(`${copyKey}.title`);

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={upsellTitle}
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
          <TooltipContent side="right">{upsellTitle}</TooltipContent>
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
      <p className="text-[11px] font-medium leading-tight text-foreground">{t(`${copyKey}.title`)}</p>
      <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
        {t(`${copyKey}.body`)}
      </p>
      <Button type="button" size="sm" className="mt-2 h-7 w-full max-w-full min-w-0 rounded-md text-xs">
        {t(`${copyKey}.cta`)}
      </Button>
    </div>
  );
}
