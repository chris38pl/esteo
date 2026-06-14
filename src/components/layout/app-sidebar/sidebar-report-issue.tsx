"use client";

import { Bug } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { ReportIssueDialog } from "@/features/issues/components/report-issue-dialog";
import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SidebarReportIssue({
  collapsed,
}: {
  collapsed?: boolean;
}) {
  const t = useTranslations("sidebar");
  const { issueTrackerEnabled, workspaces, activeWorkspaceId, locale } = useWorkspaceContext();
  const [open, setOpen] = useState(false);

  if (!issueTrackerEnabled) {
    return null;
  }

  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={collapsed ? "icon" : "default"}
        className={cn(!collapsed && "w-full justify-start gap-2")}
        onClick={() => setOpen(true)}
        title={t("reportIssue")}
      >
        <Bug className="size-4 shrink-0" />
        {!collapsed ? <span>{t("reportIssue")}</span> : null}
      </Button>

      <ReportIssueDialog
        open={open}
        onOpenChange={setOpen}
        locale={locale}
        workspaceSlug={activeWorkspace?.slug ?? null}
      />
    </>
  );
}
