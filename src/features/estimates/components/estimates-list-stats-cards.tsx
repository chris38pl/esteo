"use client";

import { CalendarCheck, Clock, Send, Trophy } from "lucide-react";
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
  iconClassName,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  iconClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn("surface-card flex min-w-0 items-center gap-4 p-5", className)}>
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1",
          iconClassName,
        )}
      >
        <Icon className="size-5" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-2xl font-semibold tracking-tight tabular-nums text-foreground">
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
    const sentCount = estimates.filter((estimate) => {
      const status = estimate.latestVersion?.status;
      return status === "SENT" || status === "ACCEPTED" || status === "REJECTED";
    }).length;
    const acceptedCount = estimates.filter(
      (estimate) => estimate.latestVersion?.status === "ACCEPTED",
    ).length;
    const winRate =
      sentCount > 0 ? `${Math.round((acceptedCount / sentCount) * 100)}%` : "—";
    const wonValue = estimates.reduce((sum, estimate) => {
      if (estimate.latestVersion?.status !== "ACCEPTED") {
        return sum;
      }
      return sum + Number(estimate.latestVersion.totalGross);
    }, 0);

    return {
      totalCount: String(totalCount),
      totalValue: formatCurrency(totalValue, locale, "PLN"),
      sentCount: String(sentCount),
      winRate,
      wonValue: formatCurrency(wonValue, locale, "PLN"),
    };
  }, [estimates, locale]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={CalendarCheck}
        label={t("list.stats.total")}
        value={stats.totalCount}
        iconClassName="bg-violet-500/10 text-violet-600 ring-violet-500/15 dark:text-violet-400"
      />
      <StatCard
        icon={Trophy}
        label={t("list.stats.wonValue")}
        value={stats.wonValue}
        iconClassName="bg-blue-500/10 text-blue-600 ring-blue-500/15 dark:text-blue-400"
      />
      <StatCard
        icon={Send}
        label={t("list.stats.sent")}
        value={stats.sentCount}
        iconClassName="bg-emerald-500/10 text-emerald-600 ring-emerald-500/15 dark:text-emerald-400"
      />
      <StatCard
        icon={Clock}
        label={t("list.stats.winRate")}
        value={stats.winRate}
        iconClassName="bg-violet-500/10 text-violet-600 ring-violet-500/15 dark:text-violet-400"
      />
    </div>
  );
}
