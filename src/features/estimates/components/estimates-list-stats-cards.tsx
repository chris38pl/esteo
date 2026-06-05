"use client";

import { CalendarCheck, Clock, Send, Vault } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

import type { EstimateListPageItem } from "@/features/estimates/server/list-estimates-page-data";
import { formatCurrency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface EstimatesListStatsCardsProps {
  estimates: EstimateListPageItem[];
  locale: Locale;
}

function StatCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("surface-card flex min-w-0 flex-col gap-3 p-5", className)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/10">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

export function EstimatesListStatsCards({ estimates, locale }: EstimatesListStatsCardsProps) {
  const t = useTranslations("estimates");

  const stats = useMemo(() => {
    const totalCount = estimates.length;
    const totalValue = estimates.reduce((sum, estimate) => {
      const gross = estimate.latestVersion ? Number(estimate.latestVersion.totalGross) : 0;
      return sum + gross;
    }, 0);
    const sentCount = estimates.filter(
      (estimate) => estimate.latestVersion?.status === "SENT",
    ).length;

    return {
      totalCount: String(totalCount),
      totalValue: formatCurrency(totalValue, locale, "PLN"),
      sentCount: String(sentCount),
      conversion: "—",
    };
  }, [estimates, locale]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={CalendarCheck} label={t("list.stats.total")} value={stats.totalCount} />
      <StatCard icon={Vault} label={t("list.stats.totalValue")} value={stats.totalValue} />
      <StatCard icon={Send} label={t("list.stats.sent")} value={stats.sentCount} />
      <StatCard icon={Clock} label={t("list.stats.conversion")} value={stats.conversion} />
    </div>
  );
}
