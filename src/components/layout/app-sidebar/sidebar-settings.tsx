"use client";

import { cn } from "@/lib/utils";
import { SidebarReportIssue } from "./sidebar-report-issue";
import { SidebarUpgrade } from "./sidebar-upgrade";
import { sidebarInsetClass } from "./sidebar-layout";
import { useSidebarLayout } from "./sidebar-layout-context";
import { useSidebarStore } from "./sidebar-store";

export function SidebarSettings({
  collapsedOverride,
}: {
  collapsedOverride?: boolean;
} = {}) {
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();

  return (
    <div
      className={cn(
        sidebarInsetClass(collapsed, inDrawer),
        "pb-3 pt-3",
        collapsed && "flex flex-col items-center gap-2",
      )}
    >
      <div
        className={cn(
          "min-w-0 max-w-full",
          collapsed ? "flex flex-col items-center gap-2" : "flex flex-col gap-4",
        )}
      >
        <SidebarReportIssue collapsed={collapsed} />
        <SidebarUpgrade collapsedOverride={collapsedOverride} />
      </div>
    </div>
  );
}