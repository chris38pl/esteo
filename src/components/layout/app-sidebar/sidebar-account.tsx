"use client";

import { BarChart3, Check, ChevronUp, Plus, Settings, Users } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { WorkspaceAvatar } from "@/components/avatars/workspace-avatar";
import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  const tWorkspaces = useTranslations("workspaces");
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();
  const {
    workspaces,
    activeWorkspace,
    canCreateAdditionalWorkspace,
    locale,
    switchWorkspace,
    isSwitching,
  } = useWorkspaceContext();

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

  const menu = (
    <DropdownMenuContent
      side={collapsed ? "right" : "top"}
      align="start"
      className="w-60"
    >
      <DropdownMenuLabel className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {t("account.workspaces")}
      </DropdownMenuLabel>
      {canCreateAdditionalWorkspace ? (
        <>
          <DropdownMenuItem asChild className="gap-2 text-xs">
            <Link href={`/${locale}/dashboard/workspaces/new`}>
              <Plus className="size-3.5 text-muted-foreground" />
              {tWorkspaces("switcher.newWorkspace")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      ) : null}
      {workspaces.map((workspace) => (
        <DropdownMenuItem
          key={workspace.id}
          className="gap-2 text-xs"
          onSelect={() => switchWorkspace(workspace.id)}
        >
          <WorkspaceAvatar name={workspace.name} size={20} className="rounded-md ring-0" />
          <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
          {workspace.id === activeWorkspace?.id ? (
            <Check className="size-3.5 shrink-0 text-primary" />
          ) : null}
        </DropdownMenuItem>
      ))}

      <DropdownMenuSeparator />

      <DropdownMenuItem className="gap-2 text-xs">
        <BarChart3 className="size-3.5 text-muted-foreground" />
        {t("account.workspaceUsage")}
      </DropdownMenuItem>
      <DropdownMenuItem className="gap-2 text-xs">
        <Settings className="size-3.5 text-muted-foreground" />
        {t("account.workspaceSettings")}
      </DropdownMenuItem>
      <DropdownMenuItem className="gap-2 text-xs">
        <Users className="size-3.5 text-muted-foreground" />
        {t("account.workspaceMembers")}
      </DropdownMenuItem>

    </DropdownMenuContent>
  );

  if (collapsed) {
    return (
      <TooltipProvider>
        <DropdownMenu modal={false}>
          <Tooltip>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent side="right">{workspaceName}</TooltipContent>
          </Tooltip>
          {menu}
        </DropdownMenu>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn(inDrawer && "w-full min-w-0 max-w-full")}>
      <DropdownMenu modal={false}>
        {trigger}
        {menu}
      </DropdownMenu>
    </div>
  );
}
