"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { AppSidebar, sidebarWidth } from "./app-sidebar";
import { useSidebarStore } from "./sidebar-store";
import { DashboardBreadcrumbDetailProvider } from "@/components/layout/dashboard-top-nav/dashboard-breadcrumb-detail-context";
import { DashboardTopNavbar } from "@/components/layout/dashboard-top-nav/dashboard-top-navbar";
import { FocusedDashboardUserMenu } from "@/components/layout/dashboard-top-nav/focused-dashboard-user-menu";
import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { WorkspaceInboxPrompt } from "@/features/workspaces/components/workspace-inbox-prompt";

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

function isAccountRoute(pathname: string): boolean {
  return pathname.endsWith("/dashboard/account");
}

/** Matches Tailwind `md:` — sidebar is visible from this width up. */
function useMdUp() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(min-width: 768px)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(min-width: 768px)").matches,
    () => false,
  );
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
  const mdUp = useMdUp();
  const contentInset = mdUp ? offset : 0;
  const { modalInboxItem, locale: contextLocale, workspaces } = useWorkspaceContext();
  const isPreWorkspaceAccount = workspaces.length === 0 && isAccountRoute(pathname);

  if (isFocusedDashboardRoute(pathname) || isPreWorkspaceAccount) {
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
    <DashboardBreadcrumbDetailProvider>
      <div className="min-h-dvh bg-background">
        <AppSidebar locale={locale} />
        <WorkspaceInboxPrompt inboxItem={modalInboxItem} locale={contextLocale} />

        <motion.div
          initial={false}
          animate={{ paddingLeft: contentInset }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
          }
          className="flex min-h-dvh min-w-0 flex-col max-md:!pl-0 md:pl-[232px]"
        >
          <DashboardTopNavbar locale={locale} />
          <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
        </motion.div>
      </div>
    </DashboardBreadcrumbDetailProvider>
  );
}
