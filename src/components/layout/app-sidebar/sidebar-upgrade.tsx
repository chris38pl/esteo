"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import type { BillingSidebarState } from "@/features/billing/billing-sidebar-state";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  SidebarPlanCard,
  SidebarPlanCardCollapsedIcon,
} from "./sidebar-plan-card";
import { useSidebarLayout } from "./sidebar-layout-context";
import { useSidebarStore } from "./sidebar-store";

type PlanCardVariant = "free" | "pro" | "business";

function planVariantFromBillingState(state: BillingSidebarState): PlanCardVariant | null {
  if (state.variant === "hidden") {
    return null;
  }
  if (state.variant === "status") {
    return "business";
  }
  return state.currentPlan === "FREE" ? "free" : "pro";
}

export function SidebarUpgrade({ collapsedOverride }: { collapsedOverride?: boolean } = {}) {
  const tPlan = useTranslations("sidebar.planCards");
  const { billingSidebarState, locale } = useWorkspaceContext();
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();

  const variant = planVariantFromBillingState(billingSidebarState);

  if (!variant) {
    return null;
  }

  const tooltip = `${tPlan(`${variant}.badge`)} — ${tPlan(`${variant}.title`)}`;

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
              <SidebarPlanCardCollapsedIcon variant={variant} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn("box-border w-full min-w-0 max-w-full", inDrawer && "overflow-hidden")}>
      <SidebarPlanCard variant={variant} locale={locale} />
    </div>
  );
}
