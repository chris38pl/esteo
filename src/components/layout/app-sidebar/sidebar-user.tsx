"use client";

import Image from "next/image";
import { ChevronUp } from "lucide-react";
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

export function SidebarUser({ collapsedOverride }: { collapsedOverride?: boolean } = {}) {
  const t = useTranslations("sidebar");
  const prefersReducedMotion = useReducedMotion();
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;

  const name = t("user.placeholder.name");
  const role = t("user.placeholder.role");

  if (collapsed) {
    return (
      <TooltipProvider>
        <DropdownMenu modal={false}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={name}
                  className={cn(
                    "group flex size-12 items-center justify-center rounded-2xl",
                    "bg-card/30 text-muted-foreground ring-1 ring-border/40",
                    "transition hover:bg-accent/30 hover:text-foreground focus-visible:outline-none",
                    "focus-visible:ring-2 focus-visible:ring-ring/35",
                  )}
                >
                  <span className="relative size-8 overflow-hidden rounded-full border border-border/60 bg-muted/40">
                    <Image src="/logo.png" alt="" fill className="object-cover" />
                  </span>
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">{name}</TooltipContent>
          </Tooltip>

          <DropdownMenuContent align="start" side="right" className="w-56">
            <DropdownMenuItem>{t("user.menu.account")}</DropdownMenuItem>
            <DropdownMenuItem>{t("user.menu.billing")}</DropdownMenuItem>
            <DropdownMenuItem>{t("user.menu.settings")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{t("user.menu.logout")}</DropdownMenuItem>
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
          "flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-3 py-2.5",
          "transition hover:bg-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
        )}
      >
        <span className="relative size-9 overflow-hidden rounded-full border border-border/60 bg-muted/40">
          <Image src="/logo.png" alt="" fill className="object-cover" />
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
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{role}</p>
        </motion.span>

        {!collapsed ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : null}
      </button>
    </DropdownMenuTrigger>
  );

  return (
    <TooltipProvider>
      <DropdownMenu modal={false}>
        {trigger}

        <DropdownMenuContent align="start" side="right" className="w-56">
          <DropdownMenuItem>{t("user.menu.account")}</DropdownMenuItem>
          <DropdownMenuItem>{t("user.menu.billing")}</DropdownMenuItem>
          <DropdownMenuItem>{t("user.menu.settings")}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>{t("user.menu.logout")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}

