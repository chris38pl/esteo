"use client";

import { useState } from "react";
import { BarChart3, Check, LogOut, Plus, Settings, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { WorkspaceAvatar } from "@/components/avatars/workspace-avatar";
import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { resolveBillingPlanCode } from "@/features/billing/billing-sidebar-state";
import { LeaveWorkspaceDialog } from "@/features/workspaces/components/leave-workspace-dialog";
import { dashboardBillingHref } from "@/lib/dashboard-routes";
import { cn } from "@/lib/utils";

export function WorkspaceSwitcherMenuContent({
  side = "bottom",
  align = "start",
}: {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}) {
  const t = useTranslations("sidebar");
  const tWorkspaces = useTranslations("workspaces");
  const tBilling = useTranslations("billing.workspace.planHero");
  const {
    workspaces,
    activeWorkspace,
    billingSidebarState,
    canCreateAdditionalWorkspace,
    locale,
    switchWorkspace,
  } = useWorkspaceContext();
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const planLabel = tBilling(`planName.${resolveBillingPlanCode(billingSidebarState)}`);
  const billingHref =
    activeWorkspace?.isOwner && activeWorkspace.slug
      ? dashboardBillingHref(locale, activeWorkspace.slug)
      : null;
  const planBadgeClassName = cn(
    "ml-auto shrink-0 rounded-md px-1.5 py-px",
    "text-[10px] font-semibold uppercase tracking-wide",
    "bg-muted/80 text-foreground/80 ring-1 ring-border/50",
  );

  return (
    <>
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
          onSelect={() => switchWorkspace(workspace.slug)}
        >
          <WorkspaceAvatar
            name={workspace.name}
            logoUrl={workspace.logoUrl}
            size={20}
            className="rounded-md ring-0"
          />
          <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
          {workspace.id === activeWorkspace?.id ? (
            <Check className="size-3.5 shrink-0 text-primary" />
          ) : null}
        </DropdownMenuItem>
      ))}

      <DropdownMenuSeparator className="bg-[color:var(--sidebar-divider)]" />

      {activeWorkspace ? (
        billingHref ? (
          <DropdownMenuItem asChild className="gap-2 text-xs">
            <Link href={billingHref}>
              <Sparkles className="size-3.5 text-muted-foreground" />
              <span className="min-w-0">{t("account.yourPlan")}</span>
              <Badge variant="outline" className={planBadgeClassName}>
                {planLabel}
              </Badge>
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className="gap-2 text-xs"
            onSelect={(event) => event.preventDefault()}
          >
            <Sparkles className="size-3.5 text-muted-foreground" />
            <span className="min-w-0">{t("account.yourPlan")}</span>
            <Badge variant="outline" className={planBadgeClassName}>
              {planLabel}
            </Badge>
          </DropdownMenuItem>
        )
      ) : null}
      {activeWorkspace?.isOwner ? (
        <DropdownMenuItem asChild className="gap-2 text-xs">
          <Link href={`/${locale}/dashboard/${activeWorkspace.slug}/workspace-usage`}>
            <BarChart3 className="size-3.5 text-muted-foreground" />
            {t("account.workspaceUsage")}
          </Link>
        </DropdownMenuItem>
      ) : null}
      {activeWorkspace?.isOwner ? (
        <DropdownMenuItem asChild className="gap-2 text-xs">
          <Link href={`/${locale}/dashboard/${activeWorkspace.slug}/settings`}>
            <Settings className="size-3.5 text-muted-foreground" />
            {t("account.workspaceSettings")}
          </Link>
        </DropdownMenuItem>
      ) : null}
      {activeWorkspace?.isOwner ? (
        <DropdownMenuItem asChild className="gap-2 text-xs">
          <Link href={`/${locale}/dashboard/${activeWorkspace.slug}/settings?tab=users`}>
            <Users className="size-3.5 text-muted-foreground" />
            {t("account.workspaceMembers")}
          </Link>
        </DropdownMenuItem>
      ) : null}
      {activeWorkspace && !activeWorkspace.isOwner ? (
        <>
          <DropdownMenuSeparator className="bg-[color:var(--sidebar-divider)]" />
          <DropdownMenuItem
            className="gap-2 text-xs text-destructive focus:text-destructive"
            onSelect={(event) => {
              event.preventDefault();
              setLeaveDialogOpen(true);
            }}
          >
            <LogOut className="size-3.5" />
            {t("account.leaveWorkspace")}
          </DropdownMenuItem>
        </>
      ) : null}
    </DropdownMenuContent>
    {activeWorkspace && !activeWorkspace.isOwner ? (
      <LeaveWorkspaceDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        workspaceId={activeWorkspace.id}
        workspaceName={activeWorkspace.name}
        locale={locale}
      />
    ) : null}
    </>
  );
}
