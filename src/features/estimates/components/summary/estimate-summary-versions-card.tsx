"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText } from "lucide-react";

import type {
  EstimateForEditorClient,
} from "@/features/estimates/lib/serialize-estimate";
import { EstimateListStatusBadge } from "@/features/estimates/components/estimate-list-status-badge";
import { EstimateNavigationOverlay } from "@/features/estimates/components/estimate-navigation-overlay";
import { formatCurrency, type Currency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

import { EstimateSummaryCardShell } from "./estimate-summary-card-shell";

type VersionRow = EstimateForEditorClient["versions"][number];

interface EstimateSummaryVersionsCardProps {
  estimate: EstimateForEditorClient;
  activeVersionId: string;
  workspaceSlug: string;
  locale: Locale;
}

function formatVersionDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function EstimateSummaryVersionsCard({
  estimate,
  activeVersionId,
  workspaceSlug,
  locale,
}: EstimateSummaryVersionsCardProps) {
  const t = useTranslations("estimates");
  const router = useRouter();
  const [switchingVersionId, setSwitchingVersionId] = useState<string | null>(null);
  const currency: Currency = estimate.currency === "EUR" ? "EUR" : "PLN";

  useEffect(() => {
    setSwitchingVersionId(null);
  }, [activeVersionId]);

  const handleSelectVersion = (version: VersionRow) => {
    if (version.id === activeVersionId) {
      return;
    }

    setSwitchingVersionId(version.id);
    router.push(
      `/${locale}/dashboard/${workspaceSlug}/estimates/${estimate.id}?v=${version.versionNumber}`,
    );
  };

  if (estimate.versions.length === 0) {
    return (
      <EstimateSummaryCardShell title={t("editor.summary.versions.title")}>
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
          {t("editor.summary.versions.empty")}
        </p>
      </EstimateSummaryCardShell>
    );
  }

  return (
    <>
      {switchingVersionId ? (
        <EstimateNavigationOverlay
          label={t("versions.switching")}
          hint={t("versions.switchingHint")}
        />
      ) : null}
      <EstimateSummaryCardShell title={t("editor.summary.versions.title")}>
      <div className="space-y-3 px-4 py-4">
        {estimate.versions.map((version) => {
          const isSelected = version.id === activeVersionId;
          const isLatest = version.id === estimate.latestVersionId;

          return (
            <button
              key={version.id}
              type="button"
              onClick={() => handleSelectVersion(version)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                isSelected
                  ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30"
                  : "border-border/70 bg-card hover:border-border hover:bg-muted/20",
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/30",
                  isLatest && isSelected && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  !isLatest && "text-muted-foreground",
                )}
              >
                <FileText className="size-4" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {t("editor.summary.versions.shortLabel", {
                        n: version.versionNumber,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatVersionDate(version.createdAt, locale)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {isLatest ? (
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                        {t("editor.summary.versions.activeBadge")}
                      </span>
                    ) : (
                      <EstimateListStatusBadge
                        status={version.status}
                        label={t(`status.${version.status}`)}
                      />
                    )}
                    <p className="text-xs font-medium tabular-nums text-muted-foreground">
                      {formatCurrency(version.totalGross, locale, currency)}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </EstimateSummaryCardShell>
    </>
  );
}
