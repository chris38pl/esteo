"use client";

import { BarChart3, Check, Plus, Settings, Users } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { WorkspaceAvatar } from "@/components/avatars/workspace-avatar";
import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function WorkspaceSwitcherMenuContent({
  side = "bottom",
  align = "start",
}: {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}) {
  const t = useTranslations("sidebar");
  const tWorkspaces = useTranslations("workspaces");
  const {
    workspaces,
    activeWorkspace,
    canCreateAdditionalWorkspace,
    locale,
    switchWorkspace,
  } = useWorkspaceContext();

  return (
    <DropdownMenuContent
      side={side}
      align={align}
      className="w-60 rounded-lg border border-[color:var(--sidebar-divider)] shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
    >
      {canCreateAdditionalWorkspace ? (
        <DropdownMenuItem asChild className="gap-2 text-xs">
          <Link href={`/${locale}/dashboard/workspaces/new`}>
            <Plus className="size-3.5 text-muted-foreground" />
            {tWorkspaces("switcher.newWorkspace")}
          </Link>
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem
          disabled
          className="gap-2 text-xs opacity-100 data-[disabled]:opacity-100"
          aria-describedby="workspace-switcher-new-upgrade-hint"
        >
          <Plus className="size-3.5 shrink-0 text-muted-foreground/50" />
          <span className="min-w-0 flex-1">
            <span className="block text-muted-foreground/70">
              {tWorkspaces("switcher.newWorkspace")}
            </span>
            <span
              id="workspace-switcher-new-upgrade-hint"
              className="mt-0.5 block text-[10px] leading-snug text-muted-foreground/55"
            >
              {tWorkspaces("switcher.newWorkspaceUpgradeRequired")}
            </span>
          </span>
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator className="bg-[color:var(--sidebar-divider)]" />

      <DropdownMenuLabel className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {t("account.workspaces")}
      </DropdownMenuLabel>
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

      <DropdownMenuSeparator className="bg-[color:var(--sidebar-divider)]" />

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
}
