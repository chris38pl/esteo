"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useSidebarStore } from "./sidebar-store";
import { SidebarCollapseButton } from "./sidebar-collapse-button";

export function SidebarHeader({
  collapsedOverride,
  showCollapseButton = true,
}: {
  collapsedOverride?: boolean;
  showCollapseButton?: boolean;
} = {}) {
  const t = useTranslations("sidebar");
  const prefersReducedMotion = useReducedMotion();
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;

  return (
    <div className="px-3 pt-3">
      {collapsed ? (
        <div className="flex items-center justify-center">
          {showCollapseButton ? <SidebarCollapseButton /> : null}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative size-10 overflow-hidden rounded-xl border border-border/60 bg-muted/40">
              <Image src="/logo.png" alt="" fill className="object-cover" />
            </div>

            <motion.div
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
              }
              className={cn("min-w-0")}
            >
              <p className="truncate text-sm font-semibold tracking-tight">
                {t("workspace.placeholderName")}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {t("workspace.plan.free")}
              </p>
            </motion.div>
          </div>

          {showCollapseButton ? <SidebarCollapseButton /> : null}
        </div>
      )}
    </div>
  );
}

