"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import {
  DashboardMetricChartCard,
  formatDashboardChartBarLabels,
} from "@/features/dashboard/components/dashboard-metric-chart-card";
import type { DashboardKpiStats } from "@/features/dashboard/lib/dashboard-kpi-types";
import type { DashboardTimeHorizon } from "@/features/dashboard/lib/dashboard-time-horizon";
import type { Locale } from "@/lib/locale";

interface DashboardChartsSectionProps {
  kpiStats: DashboardKpiStats;
  timeHorizon: DashboardTimeHorizon;
  workspaceSlug: string;
  locale: Locale;
}

export function DashboardChartsSection({
  kpiStats,
  timeHorizon,
  workspaceSlug,
  locale,
}: DashboardChartsSectionProps) {
  const t = useTranslations("dashboard.overview.charts");
  const horizonStats = kpiStats.byHorizon[timeHorizon];

  const requestsBarLabels = useMemo(
    () =>
      formatDashboardChartBarLabels(
        horizonStats.requestsChart.bars,
        horizonStats.requestsChart.granularity,
        locale,
      ),
    [horizonStats.requestsChart.bars, horizonStats.requestsChart.granularity, locale],
  );

  const incomeBarLabels = useMemo(
    () =>
      formatDashboardChartBarLabels(
        horizonStats.incomeChart.bars,
        horizonStats.incomeChart.granularity,
        locale,
      ),
    [horizonStats.incomeChart.bars, horizonStats.incomeChart.granularity, locale],
  );

  const requestsHref = `/${locale}/dashboard/${workspaceSlug}/requests`;
  const paymentsHref = `/${locale}/dashboard/${workspaceSlug}/payments`;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <DashboardMetricChartCard
        title={t("requests.title")}
        total={horizonStats.requestsChart.total}
        totalLabel={t("requests.totalLabel")}
        trendPercent={horizonStats.requestsChart.trendPercent}
        barLabels={requestsBarLabels}
        barValues={horizonStats.requestsChart.bars.map((bar) => bar.value)}
        footerHref={requestsHref}
        footerLabel={t("requests.footer")}
        locale={locale}
        variant="count"
        barClassName="bg-blue-500"
      />

      <DashboardMetricChartCard
        title={t("income.title")}
        total={horizonStats.incomeChart.total}
        totalLabel={t("income.totalLabel")}
        trendPercent={horizonStats.incomeChart.trendPercent}
        barLabels={incomeBarLabels}
        barValues={horizonStats.incomeChart.bars.map((bar) => bar.value)}
        footerHref={paymentsHref}
        footerLabel={t("income.footer")}
        locale={locale}
        variant="currency"
        currency={horizonStats.incomeChart.currency}
        barClassName="bg-violet-500"
      />
    </div>
  );
}
