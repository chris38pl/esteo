"use client";

import { BillingUsageStatsSection } from "@/features/billing/components/billing-usage-stats-section";
import { WorkspaceAttachmentsSection } from "@/features/workspace-usage/components/workspace-attachments-section";
import { WorkspaceMemberUsageTable } from "@/features/workspace-usage/components/workspace-member-usage-table";
import type { WorkspaceUsagePageData } from "@/features/workspace-usage/workspace-usage-page-data";
import { useTranslations } from "next-intl";

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  data: WorkspaceUsagePageData;
};

export function WorkspaceUsagePanel({ workspaceId, workspaceSlug, data }: Props) {
  const t = useTranslations("workspaceUsage");

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </header>

      <BillingUsageStatsSection data={data} />

      <WorkspaceMemberUsageTable memberUsage={data.memberUsage} />

      <WorkspaceAttachmentsSection
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        initialAttachments={data.attachments}
      />
    </div>
  );
}
