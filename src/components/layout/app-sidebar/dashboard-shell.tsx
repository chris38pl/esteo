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
import { SidebarNav } from "./sidebar-nav";
import { SidebarUpgrade } from "./sidebar-upgrade";
import { SidebarWorkspace } from "./sidebar-workspace";
import { SidebarUser } from "./sidebar-user";
import { SidebarFooter } from "./sidebar-footer";

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

      {/* Mobile top bar + drawer */}
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
              "fixed left-0 top-0 h-dvh w-[280px] max-w-[90vw] translate-x-0 translate-y-0 rounded-none border-r border-border/60 p-0",
              "bg-sidebar/95 text-sidebar-foreground",
            )}
          >
            <DialogHeader className="sr-only">
              <DialogTitle>{t("tooltips.openNav")}</DialogTitle>
            </DialogHeader>
            <div className="flex h-full flex-col">
              <SidebarHeader collapsedOverride={false} showCollapseButton={false} />
              <div className="flex-1 overflow-y-auto">
                <SidebarNav locale={locale} collapsedOverride={false} />
              </div>
              <div className="space-y-3 px-3 pb-3">
                <SidebarUpgrade collapsedOverride={false} />
                <SidebarWorkspace collapsedOverride={false} />
                <SidebarUser collapsedOverride={false} />
              </div>
              <SidebarFooter locale={locale} collapsedOverride={false} />
            </div>
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
        style={{ paddingLeft: 280 }}
      >
        <div className="px-6 py-6 md:px-8">{children}</div>
      </motion.main>
    </div>
  );
}

