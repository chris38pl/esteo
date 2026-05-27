"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "./sidebar-store";
import type { Locale } from "@/lib/locale";

export function SidebarFooter({
  locale,
  collapsedOverride,
}: {
  locale: Locale;
  collapsedOverride?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;

  return (
    <div className="mt-auto space-y-3 px-3 pb-3">
      <motion.div
        initial={false}
        animate={collapsed ? { opacity: 0, y: 6 } : { opacity: 1, y: 0 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
        }
        className={cn(collapsed && "pointer-events-none")}
      >
        <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 p-2">
          <LocaleSwitcher value={locale} />
          <ThemeToggle />
        </div>
      </motion.div>
    </div>
  );
}

