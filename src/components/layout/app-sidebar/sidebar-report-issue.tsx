"use client";

import { Bug } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { ReportIssueDialog } from "@/features/issues/components/report-issue-dialog";
import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { sidebarInsetClass } from "@/components/layout/app-sidebar/sidebar-layout";
import { useSidebarLayout } from "@/components/layout/app-sidebar/sidebar-layout-context";
import { useSidebarStore } from "@/components/layout/app-sidebar/sidebar-store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function SidebarReportIssue({
  collapsedOverride,
}: {
  collapsedOverride?: boolean;
} = {}) {
  const t = useTranslations("sidebar");
  const { issueTrackerEnabled, workspaces, activeWorkspaceId, locale } = useWorkspaceContext();
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();
  const [open, setOpen] = useState(false);

  if (!issueTrackerEnabled) {
    return null;
  }

  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId);
  const label = t("reportIssue");

  const trigger = collapsed ? (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "sidebar-nav-link mx-auto flex size-8 items-center justify-center rounded-lg transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
      )}
      onClick={() => setOpen(true)}
    >
      <Bug className="size-3.5 shrink-0 text-red-500/70 dark:text-red-400/80" strokeWidth={1.75} />
    </button>
  ) : (
    <button
      type="button"
      className={cn(
        "sidebar-nav-link flex min-w-0 max-w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] leading-tight transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
      )}
      onClick={() => setOpen(true)}
    >
      <Bug
        className="size-3.5 shrink-0 text-red-500/70 dark:text-red-400/80"
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
    </button>
  );

  return (
    <>
      <div className={cn(sidebarInsetClass(collapsed, inDrawer), "pb-2 pt-1")}>
        <div className="sidebar-divider mb-2 h-px w-full" aria-hidden />
        <ul>
          <li>
            {collapsed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              trigger
            )}
          </li>
        </ul>
      </div>

      <ReportIssueDialog
        open={open}
        onOpenChange={setOpen}
        locale={locale}
        workspaceSlug={activeWorkspace?.slug ?? null}
      />
    </>
  );
}
