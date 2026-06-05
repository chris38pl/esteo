"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import type { BillingSidebarState } from "@/features/billing/billing-sidebar-state";
import { dashboardBillingHref } from "@/lib/dashboard-routes";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  SidebarPlanCard,
  SidebarPlanCardCollapsedIcon,
} from "./sidebar-plan-card";
import { useSidebarLayout } from "./sidebar-layout-context";
import { useSidebarStore } from "./sidebar-store";

type PlanCardVariant = "free" | "pro" | "business";

const UPGRADE_EXIT = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1] as const,
};

function planVariantFromBillingState(state: BillingSidebarState): PlanCardVariant {
  if (state.variant === "status") {
    return "business";
  }
  return state.currentPlan === "FREE" ? "free" : "pro";
}

export function SidebarUpgrade({ collapsedOverride }: { collapsedOverride?: boolean } = {}) {
  const tPlan = useTranslations("sidebar.planCards");
  const { billingSidebarState, locale } = useWorkspaceContext();
  const billingHref = dashboardBillingHref(locale);
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();
  const prefersReducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);

  const variant = planVariantFromBillingState(billingSidebarState);

  const tooltip = `${tPlan(`${variant}.badge`)} — ${tPlan(`${variant}.title`)}`;
  const exitTransition = prefersReducedMotion ? { duration: 0 } : UPGRADE_EXIT;

  if (collapsed) {
    return (
      <AnimatePresence initial={false}>
        {visible ? (
          <motion.div
            key="sidebar-upgrade-collapsed"
            initial={false}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.88, height: 0, marginTop: 0 }
            }
            transition={exitTransition}
            className="overflow-hidden"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={billingHref}
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
          </motion.div>
        ) : null}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          key="sidebar-upgrade-expanded"
          initial={false}
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  y: 8,
                  scale: 0.96,
                  filter: "blur(2px)",
                }
          }
          transition={exitTransition}
          className={cn(
            "box-border w-full min-w-0 max-w-full overflow-hidden",
            inDrawer && "overflow-hidden",
          )}
        >
          <SidebarPlanCard
            variant={variant}
            locale={locale}
            onDismiss={() => setVisible(false)}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
