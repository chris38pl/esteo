"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EstimateForEditorClient } from "@/features/estimates/lib/serialize-estimate";
import type { VersionComparisonSummary } from "@/features/estimates/lib/compare-estimate-versions";
import { getVersionComparisonSummaryAction } from "@/features/estimates/server/version-comparison-actions";
import { formatCurrency, type Currency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

import { EstimateSummaryCardShell } from "./estimate-summary-card-shell";

interface EstimateSummaryVersionChangesCardProps {
  estimate: EstimateForEditorClient;
  activeVersionId: string;
  locale: Locale;
}

function ChangeRow({
  direction,
  primary,
  secondary,
}: {
  direction: "up" | "down";
  primary: string;
  secondary: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          direction === "up"
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            : "bg-destructive/15 text-destructive",
        )}
      >
        {direction === "up" ? (
          <ArrowUp className="size-4" />
        ) : (
          <ArrowDown className="size-4" />
        )}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{primary}</p>
        <p className="text-xs text-muted-foreground">{secondary}</p>
      </div>
    </div>
  );
}

function ComparisonSkeleton() {
  return (
    <div className="space-y-3 px-5 py-4">
      {[1, 2, 3].map((key) => (
        <div key={key} className="h-12 animate-pulse rounded-lg bg-muted/40" />
      ))}
    </div>
  );
}

export function EstimateSummaryVersionChangesCard({
  estimate,
  activeVersionId,
  locale,
}: EstimateSummaryVersionChangesCardProps) {
  const t = useTranslations("estimates");
  const [summary, setSummary] = useState<VersionComparisonSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeVersion =
    estimate.versions.find((version) => version.id === activeVersionId) ??
    estimate.versions[0];

  const baseVersionOptions = useMemo(
    () =>
      estimate.versions.filter(
        (version) =>
          activeVersion && version.versionNumber < activeVersion.versionNumber,
      ),
    [estimate.versions, activeVersion],
  );

  const newerVersionOptions = useMemo(
    () =>
      estimate.versions.filter(
        (version) =>
          activeVersion && version.versionNumber > activeVersion.versionNumber,
      ),
    [estimate.versions, activeVersion],
  );

  const comparesToNewerVersion = baseVersionOptions.length === 0;

  const defaultBaseVersionNumber = comparesToNewerVersion
    ? activeVersion?.versionNumber ?? null
    : baseVersionOptions[baseVersionOptions.length - 1]?.versionNumber ?? null;

  const defaultTargetVersionNumber = comparesToNewerVersion
    ? newerVersionOptions[0]?.versionNumber ?? null
    : activeVersion?.versionNumber ?? null;

  const [baseVersionOverride, setBaseVersionOverride] = useState<number | null>(null);
  const [targetVersionOverride, setTargetVersionOverride] = useState<number | null>(null);

  const baseVersionNumber = baseVersionOverride ?? defaultBaseVersionNumber;
  const targetVersionNumber = targetVersionOverride ?? defaultTargetVersionNumber;

  useEffect(() => {
    setBaseVersionOverride(null);
    setTargetVersionOverride(null);
  }, [activeVersionId]);

  useEffect(() => {
    if (!activeVersion || baseVersionNumber == null || targetVersionNumber == null) {
      return;
    }

    let cancelled = false;

    startTransition(() => {
      void getVersionComparisonSummaryAction({
        estimateId: estimate.id,
        workspaceId: estimate.workspaceId,
        baseVersionNumber,
        targetVersionNumber,
        locale,
      }).then((result) => {
        if (cancelled) {
          return;
        }

        if (result.success) {
          setSummary(result.data);
          setError(null);
        } else {
          setSummary(null);
          setError(result.error);
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [
    estimate.id,
    estimate.workspaceId,
    activeVersion,
    baseVersionNumber,
    targetVersionNumber,
    locale,
  ]);

  const hasComparableVersions =
    baseVersionOptions.length > 0 || newerVersionOptions.length > 0;

  if (
    !activeVersion ||
    !hasComparableVersions ||
    baseVersionNumber == null ||
    targetVersionNumber == null
  ) {
    return null;
  }

  const currency = estimate.currency as Currency;
  const formatMoney = (value: number) =>
    formatCurrency(Math.abs(value), locale, currency);

  const hasChanges =
    summary != null &&
    (summary.grossDelta !== 0 ||
      summary.addedItemsCount > 0 ||
      summary.removedItemsCount > 0);

  return (
    <EstimateSummaryCardShell
      title={t("editor.summary.changes.title", { n: baseVersionNumber })}
      headerAction={
        comparesToNewerVersion && newerVersionOptions.length > 1 ? (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{t("editor.summary.changes.compareWith")}</span>
            <select
              value={targetVersionNumber}
              onChange={(event) =>
                setTargetVersionOverride(Number(event.target.value))
              }
              className="rounded-md border border-border/70 bg-background px-2 py-1 text-xs text-foreground"
            >
              {newerVersionOptions.map((version) => (
                <option key={version.id} value={version.versionNumber}>
                  {t("editor.summary.versions.shortLabel", {
                    n: version.versionNumber,
                  })}
                </option>
              ))}
            </select>
          </label>
        ) : !comparesToNewerVersion && baseVersionOptions.length > 1 ? (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{t("editor.summary.changes.compareTo")}</span>
            <select
              value={baseVersionNumber}
              onChange={(event) =>
                setBaseVersionOverride(Number(event.target.value))
              }
              className="rounded-md border border-border/70 bg-background px-2 py-1 text-xs text-foreground"
            >
              {baseVersionOptions.map((version) => (
                <option key={version.id} value={version.versionNumber}>
                  {t("editor.summary.versions.shortLabel", {
                    n: version.versionNumber,
                  })}
                </option>
              ))}
            </select>
          </label>
        ) : null
      }
    >
      {isPending && !summary ? (
        <ComparisonSkeleton />
      ) : error ? (
        <p className="px-5 py-6 text-sm text-destructive">{error}</p>
      ) : summary && !hasChanges ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">
          {t("editor.summary.changes.noChanges")}
        </p>
      ) : summary ? (
        <div className="divide-y divide-border/60 px-5 py-2">
          {summary.grossDelta !== 0 ? (
            <ChangeRow
              direction={summary.grossDelta > 0 ? "up" : "down"}
              primary={`${summary.grossDelta > 0 ? "+" : "−"} ${formatMoney(summary.grossDelta)}`}
              secondary={t("editor.summary.changes.grossDelta")}
            />
          ) : null}

          {summary.addedItemsCount > 0 ? (
            <ChangeRow
              direction="up"
              primary={t("editor.summary.changes.addedItems", {
                count: summary.addedItemsCount,
              })}
              secondary={t("editor.summary.changes.addedItemsDesc")}
            />
          ) : null}

          {summary.removedItemsCount > 0 ? (
            <ChangeRow
              direction="down"
              primary={t("editor.summary.changes.removedItems", {
                count: summary.removedItemsCount,
              })}
              secondary={t("editor.summary.changes.removedItemsDesc")}
            />
          ) : null}
        </div>
      ) : null}

      <div className="border-t border-border/60 px-4 py-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled
                >
                  <Eye className="size-4" />
                  {t("editor.summary.changes.viewDetails")}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{t("editor.summary.changes.detailsSoon")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </EstimateSummaryCardShell>
  );
}
