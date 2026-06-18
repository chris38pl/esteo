"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { UserAvatar } from "@/components/avatars/user-avatar";
import { DashboardMetricChartCard } from "@/features/dashboard/components/dashboard-metric-chart-card";
import type { DashboardInsightsData } from "@/features/dashboard/lib/dashboard-overview-types";
import type { Locale } from "@/lib/locale";

interface DashboardChartsSectionProps {
  data: Pick<DashboardInsightsData, "requestsChart" | "incomeChart">;
  workspaceSlug: string;
  locale: Locale;
}

export function DashboardChartsSection({
  data,
  workspaceSlug,
  locale,
}: DashboardChartsSectionProps) {
  const t = useTranslations("dashboard.overview.charts");
  const tDays = useTranslations("dashboard.overview.charts.days");

  const dayLabels = useMemo(
    () =>
      data.requestsChart.bars.map((bar) => ({
        label: tDays(bar.label as "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"),
        value: bar.value,
      })),
    [data.requestsChart.bars, tDays],
  );

  const requestsHref = `/${locale}/dashboard/${workspaceSlug}/requests`;
  const paymentsHref = `/${locale}/dashboard/${workspaceSlug}/payments`;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <DashboardMetricChartCard
        title={t("requests.title")}
        total={data.requestsChart.total}
        totalLabel={t("requests.totalLabel")}
        trendPercent={data.requestsChart.trendPercent}
        bars={data.requestsChart.bars}
        dayLabels={dayLabels}
        footerHref={requestsHref}
        footerLabel={t("requests.footer")}
        locale={locale}
        variant="count"
        barClassName="bg-blue-500"
      />

      <DashboardMetricChartCard
        title={t("income.title")}
        total={data.incomeChart.total}
        totalLabel={t("income.totalLabel")}
        trendPercent={data.incomeChart.trendPercent}
        bars={data.incomeChart.bars}
        dayLabels={dayLabels}
        footerHref={paymentsHref}
        footerLabel={t("income.footer")}
        locale={locale}
        variant="currency"
        barClassName="bg-violet-500"
      />
    </div>
  );
}
