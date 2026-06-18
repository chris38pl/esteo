"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DashboardBarChart } from "@/features/dashboard/components/dashboard-bar-chart";
import { DashboardChartPeriodSelect } from "@/features/dashboard/components/dashboard-chart-period-select";
import { DashboardPanelCard } from "@/features/dashboard/components/dashboard-panel-card";
import type {
  DashboardChartBar,
  DashboardChartPeriod,
} from "@/features/dashboard/lib/dashboard-overview-types";
import { formatCurrency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface DashboardMetricChartCardProps {
  title: string;
  total: number;
  totalLabel: string;
  trendPercent: number;
  bars: DashboardChartBar[];
  dayLabels: DashboardChartBar[];
  footerHref: string;
  footerLabel: string;
  locale: Locale;
  variant: "count" | "currency";
  barClassName?: string;
}

export function DashboardMetricChartCard({
  title,
  total,
  totalLabel,
  trendPercent,
  bars,
  dayLabels,
  footerHref,
  footerLabel,
  locale,
  variant,
  barClassName,
}: DashboardMetricChartCardProps) {
  const t = useTranslations("dashboard.overview.charts");
  const [period, setPeriod] = useState<DashboardChartPeriod>("7_days");

  const chartBars = useMemo(
    () =>
      bars.map((bar, index) => ({
        label: dayLabels[index]?.label ?? bar.label,
        value: bar.value,
      })),
    [bars, dayLabels],
  );

  const formattedTotal =
    variant === "currency" ? formatCurrency(total, locale, "PLN") : String(total);

  const formatAxisValue = (value: number) => {
    if (variant === "currency") {
      if (value >= 1000) {
        return `${Math.round(value / 100) / 10}k`;
      }
      return String(value);
    }
    return String(value);
  };

  return (
    <DashboardPanelCard
      title={title}
      headerAction={<DashboardChartPeriodSelect value={period} onValueChange={setPeriod} />}
      footer={
        <Button variant="outline" className="w-full" asChild>
          <Link href={footerHref}>{footerLabel}</Link>
        </Button>
      }
    >
      <div className="space-y-5 px-5 py-5 pb-8">
        <div>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-semibold tracking-tight tabular-nums text-foreground">
              {formattedTotal}
            </p>
            <p className="pb-1 text-sm leading-tight text-muted-foreground">{totalLabel}</p>
          </div>
          <p
            className={cn(
              "mt-2 inline-flex items-center gap-1 text-sm",
              trendPercent >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400",
            )}
          >
            <ArrowUpRight className="size-3.5" />
            {t("trend", { percent: Math.abs(trendPercent) })}
          </p>
        </div>

        <DashboardBarChart
          bars={chartBars}
          formatValue={formatAxisValue}
          barClassName={barClassName}
        />
      </div>
    </DashboardPanelCard>
  );
}
