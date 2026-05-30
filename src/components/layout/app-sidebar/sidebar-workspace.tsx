"use client";

import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { cn } from "@/lib/utils";
import { SidebarAccount } from "./sidebar-account";
import { sidebarInsetClass } from "./sidebar-layout";
import { useSidebarLayout } from "./sidebar-layout-context";
import { useSidebarStore } from "./sidebar-store";

export function SidebarWorkspace({
  collapsedOverride,
}: {
  collapsedOverride?: boolean;
} = {}) {
  const { workspaces } = useWorkspaceContext();
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();

  if (workspaces.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        sidebarInsetClass(collapsed, inDrawer),
        collapsed ? "pb-1 pt-2" : "pb-1 pt-2",
      )}
    >
      <SidebarAccount collapsedOverride={collapsedOverride} />
    </div>
  );
}
