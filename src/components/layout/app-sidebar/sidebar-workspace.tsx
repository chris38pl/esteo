"use client";

import { Building2, ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebarStore } from "./sidebar-store";

export function SidebarWorkspace({ collapsedOverride }: { collapsedOverride?: boolean } = {}) {
  const t = useTranslations("sidebar");
  const prefersReducedMotion = useReducedMotion();
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;

  if (collapsed) {
    return (
      <TooltipProvider>
        <DropdownMenu modal={false}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={t("workspace.placeholderName")}
                  className={cn(
                    "group flex size-12 items-center justify-center rounded-2xl",
                    "bg-card/30 text-muted-foreground ring-1 ring-border/40",
                    "transition hover:bg-accent/30 hover:text-foreground focus-visible:outline-none",
                    "focus-visible:ring-2 focus-visible:ring-ring/35",
                  )}
                >
                  <Building2 className="size-5" />
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">{t("workspace.placeholderName")}</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" side="right" className="w-56">
            <DropdownMenuItem>{t("workspace.switch")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{t("workspace.settings")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    );
  }

  const trigger = (
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5",
          "border border-border/60 bg-card/30 text-muted-foreground",
          "transition hover:bg-accent/30 hover:text-foreground focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/35",
        )}
      >
        <span className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-muted/20">
          <Building2 className="size-4" />
        </span>

        <motion.span
          initial={false}
          animate={collapsed ? { opacity: 0, x: -6 } : { opacity: 1, x: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
          }
          className={cn("min-w-0 flex-1 text-left", collapsed && "pointer-events-none")}
        >
          <p className="truncate text-sm font-medium text-foreground">
            {t("workspace.placeholderName")}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {t("workspace.plan.free")}
          </p>
        </motion.span>

        {!collapsed ? <ChevronDown className="size-4" /> : null}
      </button>
    </DropdownMenuTrigger>
  );

  return (
    <TooltipProvider>
      <DropdownMenu modal={false}>
        {trigger}
        <DropdownMenuContent align="start" side="right" className="w-56">
          <DropdownMenuItem>{t("workspace.switch")}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>{t("workspace.settings")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}

