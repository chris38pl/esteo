"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DashboardBarChart } from "@/features/dashboard/components/dashboard-bar-chart";
import { DashboardPanelCard } from "@/features/dashboard/components/dashboard-panel-card";
import type { DashboardChartGranularity } from "@/features/dashboard/lib/dashboard-kpi-types";
import { formatCurrency, type Currency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface DashboardMetricChartCardProps {
  title: string;
  total: number;
  totalLabel: string;
  trendPercent: number;
  barLabels: string[];
  barValues: number[];
  footerHref: string;
  footerLabel: string;
  locale: Locale;
  variant: "count" | "currency";
  currency?: string;
  barClassName?: string;
}

function toCurrency(code: string | undefined): Currency {
  return code === "EUR" ? "EUR" : "PLN";
}

export function DashboardMetricChartCard({
  title,
  total,
  totalLabel,
  trendPercent,
  barLabels,
  barValues,
  footerHref,
  footerLabel,
  locale,
  variant,
  currency = "PLN",
  barClassName,
}: DashboardMetricChartCardProps) {
  const t = useTranslations("dashboard.overview.charts");

  const chartBars = barLabels.map((label, index) => ({
    label,
    value: barValues[index] ?? 0,
  }));

  const formattedTotal =
    variant === "currency"
      ? formatCurrency(total, locale, toCurrency(currency))
      : String(total);

  const formatAxisValue = (value: number) => {
    if (variant === "currency") {
      if (value >= 1000) {
        return `${Math.round(value / 100) / 10}k`;
      }
      return String(value);
    }
    return String(value);
  };

  const TrendIcon = trendPercent >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <DashboardPanelCard
      title={title}
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
            <TrendIcon className="size-3.5" />
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

export function formatDashboardChartBarLabels(
  bars: Array<{ key: string }>,
  granularity: DashboardChartGranularity,
  locale: Locale,
): string[] {
  const dateLocale = locale === "pl" ? "pl-PL" : "en-US";

  if (granularity === "daily") {
    return bars.map((bar) => {
      const date = new Date(`${bar.key}T12:00:00`);
      return new Intl.DateTimeFormat(dateLocale, { weekday: "short" }).format(date);
    });
  }

  return bars.map((bar) => {
    const [year, month] = bar.key.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return new Intl.DateTimeFormat(dateLocale, { month: "short" }).format(date);
  });
}
