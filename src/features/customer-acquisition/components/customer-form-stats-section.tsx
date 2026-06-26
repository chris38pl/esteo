"use client";

import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";

import { CustomerFormSectionShell } from "@/features/customer-acquisition/components/customer-form-section-shell";
import type { CustomerAcquisitionStats } from "@/features/customer-acquisition/server/get-customer-acquisition-stats";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type Props = {
  stats: CustomerAcquisitionStats | null;
  loading: boolean;
  locale: Locale;
};

function formatCount(value: number, locale: string): string {
  return value.toLocaleString(locale === "pl" ? "pl-PL" : "en-GB");
}

function StatItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 flex-1 px-4 py-4 text-center first:pl-0 last:pr-0 sm:py-5", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function StatItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("min-w-0 flex-1 px-4 py-4 text-center first:pl-0 last:pr-0 sm:py-5", className)}>
      <div className="mx-auto h-3 w-20 max-w-full animate-pulse rounded bg-foreground/10 dark:bg-muted" />
      <div className="mx-auto mt-3 h-8 w-12 max-w-full animate-pulse rounded bg-foreground/10 dark:bg-muted/60" />
    </div>
  );
}

export function CustomerFormStatsSection({ stats, loading, locale }: Props) {
  const t = useTranslations("customerAcquisition");

  const visits = stats ? formatCount(stats.visitCount, locale) : "—";
  const submissions = stats ? formatCount(stats.submissionCount, locale) : "—";
  const conversion = stats?.conversionRate ?? "—";

  return (
    <CustomerFormSectionShell icon={BarChart3} title={t("stats.title")}>
      {loading ? (
        <div className="flex divide-x divide-border/60" aria-busy="true" role="status">
          <span className="sr-only">{t("stats.loading")}</span>
          <StatItemSkeleton />
          <StatItemSkeleton />
          <StatItemSkeleton />
        </div>
      ) : (
        <div className="flex divide-x divide-border/60">
          <StatItem label={t("stats.visits")} value={visits} />
          <StatItem label={t("stats.submissions")} value={submissions} />
          <StatItem label={t("stats.conversion")} value={conversion} />
        </div>
      )}
    </CustomerFormSectionShell>
  );
}
