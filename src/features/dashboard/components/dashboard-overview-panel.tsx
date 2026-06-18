"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  FileText,
  Minus,
  Send,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { DashboardInsightsSection } from "@/features/dashboard/components/dashboard-insights-section";
import { DashboardStatCard } from "@/features/dashboard/components/dashboard-stat-card";
import { DashboardTimeHorizonSelect } from "@/features/dashboard/components/dashboard-time-horizon-select";
import { getDashboardPlaceholderInsights } from "@/features/dashboard/lib/dashboard-placeholder-data";
import {
  buildDashboardTrendLabel,
  dashboardTrendClassName,
  normalizeSparkline,
} from "@/features/dashboard/lib/build-dashboard-trend-label";
import type { DashboardKpiStats } from "@/features/dashboard/lib/dashboard-kpi-types";
import {
  DEFAULT_DASHBOARD_TIME_HORIZON,
  type DashboardTimeHorizon,
} from "@/features/dashboard/lib/dashboard-time-horizon";
import { formatCurrency, type Currency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

function toCurrency(code: string): Currency {
  return code === "EUR" ? "EUR" : "PLN";
}

interface DashboardOverviewPanelProps {
  greetingName: string;
  workspaceSlug: string;
  locale: Locale;
  kpiStats: DashboardKpiStats;
}

function TrendFooter({
  delta,
  horizon,
  variant,
  currency,
  locale,
  t,
}: {
  delta: number;
  horizon: DashboardTimeHorizon;
  variant: "count" | "currency";
  currency?: string;
  locale: Locale;
  t: ReturnType<typeof useTranslations<"dashboard.overview">>;
}) {
  const label = buildDashboardTrendLabel({
    delta,
    horizon,
    variant,
    currency,
    locale,
    t: (key, values) => t(`trends.${key}`, values),
  });

  const Icon =
    delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;

  return (
    <span className={cn("inline-flex items-center gap-1", dashboardTrendClassName(delta))}>
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}

export function DashboardOverviewPanel({
  greetingName,
  workspaceSlug,
  locale,
  kpiStats,
}: DashboardOverviewPanelProps) {
  const t = useTranslations("dashboard.overview");
  const [timeHorizon, setTimeHorizon] = useState<DashboardTimeHorizon>(
    DEFAULT_DASHBOARD_TIME_HORIZON,
  );

  const horizonStats = kpiStats.byHorizon[timeHorizon];

  const cards = useMemo(
    () => ({
      estimates: {
        value: String(horizonStats.estimates.value),
        trendDelta: horizonStats.estimates.trendDelta,
        sparkline: normalizeSparkline(horizonStats.estimates.sparkline),
      },
      sent: {
        value: String(horizonStats.sent.value),
        trendDelta: horizonStats.sent.trendDelta,
        sparkline: normalizeSparkline(horizonStats.sent.sparkline),
      },
      income: {
        value: formatCurrency(
          horizonStats.income.value,
          locale,
          toCurrency(horizonStats.income.currency),
        ),
        trendDelta: horizonStats.income.trendDelta,
        currency: horizonStats.income.currency,
        sparkline: normalizeSparkline(horizonStats.income.sparkline),
      },
      overdue: {
        value: formatCurrency(
          kpiStats.overdue.amount,
          locale,
          toCurrency(kpiStats.overdue.currency),
        ),
        trendCount: kpiStats.overdue.count,
        sparkline: normalizeSparkline(kpiStats.overdue.sparkline),
      },
    }),
    [horizonStats, kpiStats.overdue, locale],
  );

  const paymentsHref = `/${locale}/dashboard/${workspaceSlug}/payments`;
  const insightsData = getDashboardPlaceholderInsights();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("greeting", { name: greetingName })}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <DashboardTimeHorizonSelect value={timeHorizon} onValueChange={setTimeHorizon} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          icon={FileText}
          title={t("cards.estimates")}
          value={cards.estimates.value}
          sparklinePoints={cards.estimates.sparkline}
          iconClassName="bg-blue-500/15 text-blue-600 dark:text-blue-400"
          sparklineClassName="text-blue-500 dark:text-blue-400"
          footer={
            <TrendFooter
              delta={cards.estimates.trendDelta}
              horizon={timeHorizon}
              variant="count"
              locale={locale}
              t={t}
            />
          }
        />

        <DashboardStatCard
          icon={Send}
          title={t("cards.sent")}
          value={cards.sent.value}
          sparklinePoints={cards.sent.sparkline}
          iconClassName="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          sparklineClassName="text-emerald-500 dark:text-emerald-400"
          footer={
            <TrendFooter
              delta={cards.sent.trendDelta}
              horizon={timeHorizon}
              variant="count"
              locale={locale}
              t={t}
            />
          }
        />

        <DashboardStatCard
          icon={Banknote}
          title={t("cards.income")}
          value={cards.income.value}
          sparklinePoints={cards.income.sparkline}
          iconClassName="bg-violet-500/15 text-violet-600 dark:text-violet-400"
          sparklineClassName="text-violet-500 dark:text-violet-400"
          footer={
            <TrendFooter
              delta={cards.income.trendDelta}
              horizon={timeHorizon}
              variant="currency"
              currency={horizonStats.income.currency}
              locale={locale}
              t={t}
            />
          }
        />

        <DashboardStatCard
          icon={Wallet}
          title={t("cards.overduePayments")}
          value={cards.overdue.value}
          sparklinePoints={cards.overdue.sparkline}
          iconClassName="bg-amber-500/15 text-amber-600 dark:text-amber-400"
          sparklineClassName="text-amber-500 dark:text-amber-400"
          href={paymentsHref}
          footer={
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3.5" />
              {t("trends.overdueWarning", { count: cards.overdue.trendCount })}
            </span>
          }
        />
      </div>

      <DashboardInsightsSection
        data={insightsData}
        kpiStats={kpiStats}
        timeHorizon={timeHorizon}
        workspaceSlug={workspaceSlug}
        locale={locale}
      />
    </div>
  );
}
