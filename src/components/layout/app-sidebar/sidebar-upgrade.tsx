"use client";

import { Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebarStore } from "./sidebar-store";

export function SidebarUpgrade({ collapsedOverride }: { collapsedOverride?: boolean } = {}) {
  const t = useTranslations("sidebar");
  const prefersReducedMotion = useReducedMotion();
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t("upgrade.title")}
              className={cn(
                "group flex size-12 items-center justify-center rounded-2xl",
                "bg-primary/8 text-primary ring-1 ring-border/40",
                "transition hover:bg-primary/12 focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring/35",
              )}
            >
              <Sparkles className="size-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{t("upgrade.title")}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Placeholder: always show upgrade (free plan)
  const card = (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-3",
        "shadow-[0_10px_40px_-24px_rgba(59,130,246,0.45)]",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/16 via-transparent to-transparent" />
      <div className="relative flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl border border-border/60 bg-primary/10 text-primary">
          <Sparkles className="size-4" />
        </div>

        <motion.div
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
          }
          className={cn("min-w-0 flex-1")}
        >
          <p className="truncate text-xs font-medium text-foreground pb-1">
            {t("upgrade.title")}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground pb-2">
            {t("upgrade.body")}
          </p>
        </motion.div>
      </div>

      <Button type="button" size="sm" className="relative mt-3 w-full rounded-md">
        {t("upgrade.cta")}
      </Button>
    </div>
  );

  return (
    <TooltipProvider>
      {card}
    </TooltipProvider>
  );
}

