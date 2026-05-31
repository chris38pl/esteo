"use client";

import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { ActiveWorkspaceCard } from "@/components/layout/app-sidebar/active-workspace-card";
import { SidebarAccount } from "@/components/layout/app-sidebar/sidebar-account";
import { cn } from "@/lib/utils";
import { sidebarInsetClass } from "./sidebar-layout";
import { useSidebarLayout } from "./sidebar-layout-context";
import { useSidebarStore } from "./sidebar-store";

export function SidebarWorkspace({
  collapsedOverride,
}: {
  collapsedOverride?: boolean;
} = {}) {
  const { workspaces, memberPreviews, memberTotalCount } = useWorkspaceContext();
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();

  if (workspaces.length === 0) {
    return null;
  }

  return (
    <div className={cn(collapsed && cn(sidebarInsetClass(collapsed, inDrawer), "pb-1 pt-2"))}>
      {collapsed ? (
        <SidebarAccount collapsedOverride={collapsedOverride} />
      ) : (
        <ActiveWorkspaceCard
          memberPreviews={memberPreviews}
          memberTotalCount={memberTotalCount}
        />
      )}
    </div>
  );
}
