"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

import type { Locale } from "@/lib/locale";
import { AppSidebar, sidebarWidth } from "./app-sidebar";
import { useSidebarStore } from "./sidebar-store";
import { DashboardTopNavbar } from "@/components/layout/dashboard-top-nav/dashboard-top-navbar";

const FOCUSED_ROUTE_SUFFIXES = [
  "/dashboard/onboarding",
  "/dashboard/pending-access",
] as const;

function isFocusedDashboardRoute(pathname: string): boolean {
  return FOCUSED_ROUTE_SUFFIXES.some((suffix) => pathname.endsWith(suffix));
}

export function DashboardShell({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const prefersReducedMotion = useReducedMotion();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const offset = sidebarWidth(collapsed);

  if (isFocusedDashboardRoute(pathname)) {
    return <div className="min-h-dvh bg-background">{children}</div>;
  }

  return (
    <div className="min-h-dvh bg-background">
      <AppSidebar locale={locale} />

      <motion.div
        initial={false}
        animate={{ paddingLeft: offset }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
        }
        className="flex min-h-dvh min-w-0 flex-col"
        style={{ paddingLeft: 232 }}
      >
        <DashboardTopNavbar locale={locale} />
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
      </motion.div>
    </div>
  );
}
