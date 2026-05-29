"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/locale";
import { useSidebarStore } from "./sidebar-store";
import { SidebarHeader } from "./sidebar-header";
import { SidebarSearch } from "./sidebar-search";
import { SidebarDivider } from "./sidebar-divider";
import { SidebarNav } from "./sidebar-nav";
import { SidebarPinned } from "./sidebar-pinned";
import { SidebarTeam } from "./sidebar-team";
import { SidebarSettings } from "./sidebar-settings";

const EXPANDED = 232;
const COLLAPSED = 64;

export function AppSidebar({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const collapsed = useSidebarStore((s) => s.collapsed);

  return (
    <motion.aside
      aria-label="App navigation" // i18n-ignore-line
      initial={false}
      animate={{ width: collapsed ? COLLAPSED : EXPANDED }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
      }
      className={cn(
        "surface-sidebar fixed inset-y-0 left-0 z-40 hidden flex-col overflow-x-hidden",
        "border-r border-sidebar-border",
        "bg-sidebar text-sidebar-foreground",
        "shadow-[inset_-1px_0_0_rgba(0,0,0,0.02)]",
        "dark:shadow-[0_30px_120px_-70px_rgba(0,0,0,0.8)]",
        "md:flex",
        className,
      )}
      style={{ width: EXPANDED }}
    >
      <SidebarHeader />
      <SidebarDivider />
      <SidebarSearch />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <SidebarNav locale={locale} />
        <SidebarDivider />
        <SidebarPinned locale={locale} />
        <SidebarDivider />
        <SidebarTeam />
      </div>

      <SidebarSettings />
    </motion.aside>
  );
}

export function sidebarWidth(collapsed: boolean) {
  return collapsed ? COLLAPSED : EXPANDED;
}
