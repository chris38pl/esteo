"use client";

import { useTranslations } from "next-intl";

import type { StorageExplorerSummary } from "@/features/admin-storage/lib/storage-explorer-types";
import { formatBytes } from "@/features/attachments/lib/format-bytes";
import { Badge } from "@/components/ui/badge";

export function StorageExplorerSummaryCards({ summary }: { summary: StorageExplorerSummary }) {
  const t = useTranslations("admin.storageExplorer.summary");
  const tEnv = useTranslations("admin.storageExplorer.environments");

  const cards = [
    {
      label: t("quotaCounted"),
      value: formatBytes(BigInt(summary.quotaCountedBytes)),
      detail: t("quotaCountedFiles", { count: summary.quotaCountedFiles }),
    },
    {
      label: t("nonQuota"),
      value: formatBytes(BigInt(summary.nonQuotaBytes)),
      detail: t("nonQuotaFiles", { count: summary.nonQuotaFiles }),
    },
    {
      label: t("workspaces"),
      value: String(summary.workspaceCount),
      detail: t("workspacesHint"),
    },
    {
      label: t("utOrphans"),
      value:
        summary.utOrphanFiles !== null ? String(summary.utOrphanFiles) : t("notScanned"),
      detail:
        summary.lastUtScanAt !== null
          ? t("lastScan", { date: new Date(summary.lastUtScanAt).toLocaleString() })
          : t("scanHint"),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("connectedEnvironment")}</span>
        <Badge variant="secondary">{tEnv(summary.currentEnvironment)}</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-border/60 bg-card/60 px-4 py-3 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {card.label}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{card.value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{card.detail}</p>
        </div>
      ))}
      </div>
    </div>
  );
}
