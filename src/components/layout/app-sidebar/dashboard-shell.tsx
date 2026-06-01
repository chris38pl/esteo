"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { AppSidebar, sidebarWidth } from "./app-sidebar";
import { useSidebarStore } from "./sidebar-store";
import { DashboardTopNavbar } from "@/components/layout/dashboard-top-nav/dashboard-top-navbar";
import { FocusedDashboardUserMenu } from "@/components/layout/dashboard-top-nav/focused-dashboard-user-menu";
import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { WorkspaceInvitationPrompt } from "@/features/workspaces/components/workspace-invitation-prompt";

const FOCUSED_ROUTE_SUFFIXES = [
  "/dashboard/onboarding",
  "/dashboard/pending-access",
  "/dashboard/invitations",
] as const;

function isFocusedDashboardRoute(pathname: string): boolean {
  return FOCUSED_ROUTE_SUFFIXES.some((suffix) => pathname.endsWith(suffix));
}

function isOnboardingRoute(pathname: string): boolean {
  return pathname.endsWith("/dashboard/onboarding");
}

function isInvitationsRoute(pathname: string): boolean {
  return pathname.endsWith("/dashboard/invitations");
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
  const { modalInvitation, locale: contextLocale } = useWorkspaceContext();

  if (isFocusedDashboardRoute(pathname)) {
    return (
      <div
        className={cn(
          "min-h-dvh",
          isInvitationsRoute(pathname) ? "bg-transparent" : "bg-background",
        )}
      >
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-end p-3 sm:p-4",
            isOnboardingRoute(pathname) && "max-lg:hidden",
          )}
        >
          <div className="pointer-events-auto">
            <FocusedDashboardUserMenu />
          </div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <AppSidebar locale={locale} />
      <WorkspaceInvitationPrompt invitation={modalInvitation} locale={contextLocale} />

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
