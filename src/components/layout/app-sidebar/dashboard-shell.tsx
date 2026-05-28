"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";

import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { AppSidebar, sidebarWidth } from "./app-sidebar";
import { useSidebarStore } from "./sidebar-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SidebarHeader } from "./sidebar-header";
import { SidebarSearch } from "./sidebar-search";
import { SidebarNav } from "./sidebar-nav";
import { SidebarDivider } from "./sidebar-divider";
import { SidebarPinned } from "./sidebar-pinned";
import { SidebarTeam } from "./sidebar-team";
import { SidebarSettings } from "./sidebar-settings";
import { SidebarLayoutProvider } from "./sidebar-layout-context";

export function DashboardShell({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const t = useTranslations("sidebar");
  const prefersReducedMotion = useReducedMotion();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const offset = sidebarWidth(collapsed);

  return (
    <div className="min-h-dvh">
      <AppSidebar locale={locale} />

      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur md:hidden">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("tooltips.openNav")}
              className="rounded-xl border-border/60 bg-card/50"
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
                <SidebarDivider />
                <SidebarSearch collapsedOverride={false} />
                <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-x-hidden overflow-y-auto">
                  <SidebarNav locale={locale} collapsedOverride={false} />
                  <SidebarDivider />
                  <SidebarPinned locale={locale} collapsedOverride={false} />
                  <SidebarDivider />
                  <SidebarTeam collapsedOverride={false} />
                </div>
                <SidebarDivider />
                <SidebarSettings locale={locale} collapsedOverride={false} />
              </div>
            </SidebarLayoutProvider>
          </DialogContent>
        </Dialog>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium tracking-tight">{t("meta.appName")}</p>
          <p className="truncate text-xs text-muted-foreground">{t("nav.dashboard")}</p>
        </div>
      </div>

      <motion.main
        initial={false}
        animate={{ paddingLeft: offset }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
        }
        className="min-h-dvh md:pt-0"
        style={{ paddingLeft: 232 }}
      >
        <div className="px-6 py-6 md:px-8">{children}</div>
      </motion.main>
    </div>
  );
}
