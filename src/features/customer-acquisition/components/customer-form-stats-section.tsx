"use client";

import { useTranslations } from "next-intl";

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
    <div className={cn("min-w-0 flex-1 px-4 py-1 text-center first:pl-0 last:pr-0", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

export function CustomerFormStatsSection({ stats, loading, locale }: Props) {
  const t = useTranslations("customerAcquisition");

  const visits = stats ? formatCount(stats.visitCount, locale) : "—";
  const submissions = stats ? formatCount(stats.submissionCount, locale) : "—";
  const conversion = stats?.conversionRate ?? "—";

  return (
    <section className="rounded-xl border border-border/60 p-4">
      <p className="text-sm font-medium text-foreground">{t("stats.title")}</p>
      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("stats.loading")}</p>
      ) : (
        <div className="mt-4 flex divide-x divide-border/60">
          <StatItem label={t("stats.visits")} value={visits} />
          <StatItem label={t("stats.submissions")} value={submissions} />
          <StatItem label={t("stats.conversion")} value={conversion} />
        </div>
      )}
    </section>
  );
}
