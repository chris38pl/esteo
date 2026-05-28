"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useSidebarStore } from "./sidebar-store";
import { SidebarCollapseButton } from "./sidebar-collapse-button";
import { sidebarInsetClass } from "./sidebar-layout";
import { useSidebarLayout } from "./sidebar-layout-context";

export function SidebarHeader({
  collapsedOverride,
  showCollapseButton = true,
}: {
  collapsedOverride?: boolean;
  showCollapseButton?: boolean;
} = {}) {
  const t = useTranslations("sidebar");
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();

  return (
    <div
      className={cn(
        sidebarInsetClass(collapsed, inDrawer),
        "pb-2.5 pt-4",
        collapsed && "px-1.5 pb-2 pt-2",
      )}
    >
      {collapsed ? (
        <div className="flex items-center justify-center">
          {showCollapseButton ? <SidebarCollapseButton /> : null}
        </div>
      ) : (
        <div className="flex min-w-0 max-w-full items-center gap-2 px-2">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="relative size-6 shrink-0 overflow-hidden rounded-md bg-[var(--sidebar-search)] ring-1 ring-sidebar-search-border">
              <Image src="/logo.png" alt="" fill className="object-cover" />
            </div>
            <p className="sidebar-heading truncate text-[13px] font-semibold leading-none tracking-tight">
              {t("meta.appName")}
            </p>
          </div>
          {showCollapseButton ? <SidebarCollapseButton /> : null}
        </div>
      )}
    </div>
  );
}
