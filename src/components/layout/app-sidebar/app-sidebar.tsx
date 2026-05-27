"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/locale";
import { useSidebarStore } from "./sidebar-store";
import { SidebarHeader } from "./sidebar-header";
import { SidebarNav } from "./sidebar-nav";
import { SidebarUpgrade } from "./sidebar-upgrade";
import { SidebarWorkspace } from "./sidebar-workspace";
import { SidebarUser } from "./sidebar-user";
import { SidebarFooter } from "./sidebar-footer";

const EXPANDED = 280;
const COLLAPSED = 88;

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
        "surface-sidebar fixed inset-y-0 left-0 z-40 hidden flex-col",
        "border-r border-sidebar-border",
        "bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/85",
        "shadow-[0_30px_120px_-70px_rgba(0,0,0,0.8)]",
        "md:flex",
        className,
      )}
      style={{ width: EXPANDED }}
    >
      <SidebarHeader />

      <div className="flex-1 overflow-y-auto">
        <SidebarNav locale={locale} />
      </div>

      <div
        className={cn(
          "space-y-3 px-3 pb-3",
          collapsed && "flex flex-col items-center space-y-3 px-0",
        )}
      >
        <SidebarUpgrade />
        <SidebarWorkspace />
        <SidebarUser />
      </div>

      <SidebarFooter locale={locale} />
    </motion.aside>
  );
}

export function sidebarWidth(collapsed: boolean) {
  return collapsed ? COLLAPSED : EXPANDED;
}

