"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  FileText,
  Minus,
  Send,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { DashboardStatCard } from "@/features/dashboard/components/dashboard-stat-card";
import { DashboardTimeHorizonSelect } from "@/features/dashboard/components/dashboard-time-horizon-select";
import {
  DEFAULT_DASHBOARD_TIME_HORIZON,
  type DashboardTimeHorizon,
} from "@/features/dashboard/lib/dashboard-time-horizon";
import { formatCurrency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";

interface DashboardOverviewPanelProps {
  greetingName: string;
  workspaceSlug: string;
  locale: Locale;
}

type PlaceholderCardData = {
  estimates: { value: number; trendKey: "estimatesUp"; points: readonly number[] };
  sent: { value: number; trendKey: "sentUp"; points: readonly number[] };
  income: { value: number; trendKey: "incomeFlat"; points: readonly number[] };
  overdue: {
    value: number;
    trendKey: "overdueWarning";
    trendCount: number;
    points: readonly number[];
  };
};

const PLACEHOLDER_BY_HORIZON: Record<DashboardTimeHorizon, PlaceholderCardData> = {
  all: {
    estimates: { value: 12, trendKey: "estimatesUp", points: [4, 6, 5, 8, 7, 10, 12] },
    sent: { value: 86, trendKey: "sentUp", points: [52, 58, 61, 70, 74, 80, 86] },
    income: { value: 48_320, trendKey: "incomeFlat", points: [42, 44, 43, 45, 46, 47, 48] },
    overdue: {
      value: 28_117.8,
      trendKey: "overdueWarning",
      trendCount: 3,
      points: [32, 30, 31, 29, 28, 29, 28],
    },
  },
  this_week: {
    estimates: { value: 3, trendKey: "estimatesUp", points: [1, 1, 2, 2, 3] },
    sent: { value: 8, trendKey: "sentUp", points: [3, 4, 5, 6, 8] },
    income: { value: 6_240, trendKey: "incomeFlat", points: [4, 5, 5, 6, 6] },
    overdue: {
      value: 9_420,
      trendKey: "overdueWarning",
      trendCount: 1,
      points: [11, 10, 10, 9, 9],
    },
  },
  this_month: {
    estimates: { value: 7, trendKey: "estimatesUp", points: [2, 3, 4, 5, 6, 7] },
    sent: { value: 24, trendKey: "sentUp", points: [10, 12, 15, 18, 21, 24] },
    income: { value: 18_960, trendKey: "incomeFlat", points: [12, 14, 15, 16, 17, 19] },
    overdue: {
      value: 14_280,
      trendKey: "overdueWarning",
      trendCount: 2,
      points: [16, 15, 15, 14, 14, 14],
    },
  },
  this_year: {
    estimates: { value: 12, trendKey: "estimatesUp", points: [2, 4, 5, 7, 9, 10, 12] },
    sent: { value: 86, trendKey: "sentUp", points: [18, 28, 42, 55, 68, 78, 86] },
    income: { value: 48_320, trendKey: "incomeFlat", points: [8, 14, 22, 30, 36, 42, 48] },
    overdue: {
      value: 28_117.8,
      trendKey: "overdueWarning",
      trendCount: 3,
      points: [34, 32, 31, 30, 29, 28, 28],
    },
  },
};

export function DashboardOverviewPanel({
  greetingName,
  workspaceSlug,
  locale,
}: DashboardOverviewPanelProps) {
  const t = useTranslations("dashboard.overview");
  const [timeHorizon, setTimeHorizon] = useState<DashboardTimeHorizon>(
    DEFAULT_DASHBOARD_TIME_HORIZON,
  );

  const cards = useMemo(() => {
    const data = PLACEHOLDER_BY_HORIZON[timeHorizon];

    return {
      estimates: {
        ...data.estimates,
        value: String(data.estimates.value),
      },
      sent: {
        ...data.sent,
        value: String(data.sent.value),
      },
      income: {
        ...data.income,
        value: formatCurrency(data.income.value, locale, "PLN"),
      },
      overdue: {
        ...data.overdue,
        value: formatCurrency(data.overdue.value, locale, "PLN"),
      },
    };
  }, [locale, timeHorizon]);

  const paymentsHref = `/${locale}/dashboard/${workspaceSlug}/payments`;

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
          sparklinePoints={cards.estimates.points}
          iconClassName="bg-blue-500/15 text-blue-600 dark:text-blue-400"
          sparklineClassName="text-blue-500 dark:text-blue-400"
          footer={
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="size-3.5" />
              {t(`trends.${cards.estimates.trendKey}`)}
            </span>
          }
        />

        <DashboardStatCard
          icon={Send}
          title={t("cards.sent")}
          value={cards.sent.value}
          sparklinePoints={cards.sent.points}
          iconClassName="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          sparklineClassName="text-emerald-500 dark:text-emerald-400"
          footer={
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="size-3.5" />
              {t(`trends.${cards.sent.trendKey}`)}
            </span>
          }
        />

        <DashboardStatCard
          icon={Banknote}
          title={t("cards.income")}
          value={cards.income.value}
          sparklinePoints={cards.income.points}
          iconClassName="bg-violet-500/15 text-violet-600 dark:text-violet-400"
          sparklineClassName="text-violet-500 dark:text-violet-400"
          footer={
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Minus className="size-3.5" />
              {t(`trends.${cards.income.trendKey}`)}
            </span>
          }
        />

        <DashboardStatCard
          icon={Wallet}
          title={t("cards.overduePayments")}
          value={cards.overdue.value}
          sparklinePoints={cards.overdue.points}
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
    </div>
  );
}
