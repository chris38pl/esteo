"use client";

import { ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

import { WorkspaceAvatar } from "@/components/avatars/workspace-avatar";
import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { WorkspaceSwitcherMenuContent } from "@/components/layout/app-sidebar/workspace-switcher-menu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSidebarLayout } from "./sidebar-layout-context";
import { useSidebarStore } from "./sidebar-store";

export function SidebarAccount({
  collapsedOverride,
}: {
  collapsedOverride?: boolean;
} = {}) {
  const t = useTranslations("sidebar");
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();
  const { workspaces, activeWorkspace, isSwitching } = useWorkspaceContext();

  if (workspaces.length === 0) {
    return null;
  }

  const workspaceName =
    activeWorkspace?.name ?? t("workspace.placeholderName");
  const trigger = (
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        disabled={isSwitching}
        className={cn(
          "group flex w-full max-w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-sidebar-border bg-[var(--sidebar-search)]",
          "px-2 py-1.5 text-left transition hover:bg-accent/30",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
          collapsed && "mx-auto size-8 justify-center border-0 bg-transparent p-0 hover:bg-[var(--sidebar-nav-hover)]",
        )}
      >
        <WorkspaceAvatar name={workspaceName} size={collapsed ? 28 : 26} className="ring-0" />
        {!collapsed ? (
          <>
            <span className="sidebar-heading min-w-0 flex-1 truncate text-xs font-medium leading-tight">
              {workspaceName}
            </span>
            <ChevronUp className="size-3.5 shrink-0 text-muted-foreground" />
          </>
        ) : null}
      </button>
    </DropdownMenuTrigger>
  );

  if (collapsed) {
    return (
      <TooltipProvider>
        <DropdownMenu modal={false}>
          <Tooltip>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent side="right">{workspaceName}</TooltipContent>
          </Tooltip>
          <WorkspaceSwitcherMenuContent side="right" align="start" />
        </DropdownMenu>
      </TooltipProvider>
    );
  }

  return null;
}
