"use client";

import { useEffect } from "react";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";

import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarLayoutProvider } from "@/components/layout/app-sidebar/sidebar-layout-context";
import { SidebarHeader } from "@/components/layout/app-sidebar/sidebar-header";
import { SidebarWorkspace } from "@/components/layout/app-sidebar/sidebar-workspace";
import { SidebarSearch } from "@/components/layout/app-sidebar/sidebar-search";
import { SidebarNav } from "@/components/layout/app-sidebar/sidebar-nav";
import { SidebarAdmin } from "@/components/layout/app-sidebar/sidebar-admin";
import { SidebarQaTesting } from "@/components/layout/app-sidebar/sidebar-qa-testing";
import { SidebarPinned } from "@/components/layout/app-sidebar/sidebar-pinned";
import { SidebarTeam } from "@/components/layout/app-sidebar/sidebar-team";
import { SidebarReportIssue } from "@/components/layout/app-sidebar/sidebar-report-issue";
import { SidebarTips } from "@/components/layout/app-sidebar/sidebar-tips";
import { SidebarReferrals } from "@/components/layout/app-sidebar/sidebar-referrals";
import { SidebarSettings } from "@/components/layout/app-sidebar/sidebar-settings";
import { DashboardBreadcrumbs } from "./dashboard-breadcrumbs";
import { NavbarNotificationsButton } from "./navbar-notifications-button";
import { NavbarSearchButton } from "@/features/search/components/navbar-search-button";
import { NavbarUserMenu } from "./navbar-user-menu";

import type { NotificationCounts } from "@/features/notifications/lib/notification-types";

export function DashboardTopNavbar({
  locale,
  notificationCounts,
}: {
  locale: Locale;
  notificationCounts: NotificationCounts;
}) {
  const t = useTranslations("sidebar");

  useEffect(() => {
    document.documentElement.dataset.dashboardNav = "";
    return () => {
      delete document.documentElement.dataset.dashboardNav;
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/60",
        "bg-background/85 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/75",
        "md:px-6",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("tooltips.openNav")}
              className="size-9 shrink-0 rounded-lg border-border/60 bg-card/40 md:hidden"
            >
              <Menu className="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent
            showCloseButton
            className={cn(
              "sidebar-drawer-panel fixed top-0 left-0 z-50 flex h-dvh w-[min(232px,90vw)] max-w-[min(232px,90vw)] translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-r border-sidebar-border p-0 shadow-lg outline-none",
              "bg-sidebar text-sidebar-foreground sm:max-w-[min(232px,90vw)]",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
            )}
          >
            <DialogHeader className="sr-only">
              <DialogTitle>{t("tooltips.openNav")}</DialogTitle>
            </DialogHeader>
            <SidebarLayoutProvider inDrawer>
              <div className="flex h-full min-w-0 max-w-full flex-col overflow-hidden">
                <SidebarHeader collapsedOverride={false} showCollapseButton={false} />
                <SidebarWorkspace collapsedOverride={false} />
                <SidebarSearch collapsedOverride={false} />
                <div className="sidebar-scroll flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-x-hidden overflow-y-auto">
                  <SidebarNav locale={locale} collapsedOverride={false} />
                  <SidebarAdmin locale={locale} collapsedOverride={false} />
                  <SidebarQaTesting locale={locale} collapsedOverride={false} />
                  <SidebarPinned locale={locale} collapsedOverride={false} />
                  <SidebarTeam collapsedOverride={false} />
                  <SidebarTips collapsedOverride={false} />
                  <SidebarReferrals collapsedOverride={false} />
                  <SidebarReportIssue collapsedOverride={false} />
                  <SidebarSettings collapsedOverride={false} />
                </div>
              </div>
            </SidebarLayoutProvider>
          </DialogContent>
        </Dialog>

        <DashboardBreadcrumbs locale={locale} className="hidden sm:flex" />
        <p className="truncate text-sm font-medium sm:hidden">{t("meta.appName")}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <NavbarSearchButton />
        <NavbarNotificationsButton locale={locale} initialCounts={notificationCounts} />
        <div className="hidden items-center gap-1.5 md:flex">
          <LocaleSwitcher value={locale} compact />
          <ThemeToggle compact />
        </div>
        <NavbarUserMenu locale={locale} />
      </div>
    </header>
  );
}
