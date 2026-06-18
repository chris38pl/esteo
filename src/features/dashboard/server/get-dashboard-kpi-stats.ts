import { cache } from "react";

import { prisma } from "@/db/client";
import type { ActivityMetadata } from "@/features/estimates/lib/estimate-activity-types";
import { ESTIMATE_ACTIVITY_ACTIONS } from "@/features/estimates/lib/estimate-activity-types";
import {
  getInstallmentRemainingAmount,
  isInstallmentOverdue,
} from "@/features/estimates/lib/payment-installment-status";
import {
  bucketAmountsByDay,
  bucketAmountsByKeys,
  bucketByDay,
  bucketCountsByKeys,
  currentWeekDayKeys,
  isDateInRange,
  last12MonthKeys,
  last7DayKeys,
  resolveDashboardPeriodRanges,
  startOfDay,
  toDayKey,
  toMonthKey,
  type DateRangeBounds,
} from "@/features/dashboard/lib/dashboard-date-ranges";
import type {
  DashboardChartGranularity,
  DashboardChartMetric,
  DashboardKpiHorizonStats,
  DashboardKpiStats,
} from "@/features/dashboard/lib/dashboard-kpi-types";
import type { DashboardTimeHorizon } from "@/features/dashboard/lib/dashboard-time-horizon";

const SENT_STATUSES = ["SENT", "ACCEPTED", "REJECTED"] as const;

type EstimateRow = {
  createdAt: Date;
  latestVersion: {
    lastSentAt: Date | null;
    status: string;
  } | null;
};

type RequestRow = {
  createdAt: Date;
};

type PaymentLogRow = {
  occurredAt: Date;
  metadata: unknown;
};

type InstallmentRow = {
  amount: { toString(): string };
  paidAmount: { toString(): string };
  dueDate: Date | null;
  estimate: { currency: string };
};

function parsePaymentLog(row: PaymentLogRow): { amount: number; currency: string; date: Date } | null {
  if (row.metadata == null || typeof row.metadata !== "object" || Array.isArray(row.metadata)) {
    return null;
  }

  const metadata = row.metadata as ActivityMetadata;
  const amount = metadata.paymentAmount;

  if (amount == null || !Number.isFinite(amount)) {
    return null;
  }

  return {
    amount,
    currency: metadata.currency ?? "PLN",
    date: row.occurredAt,
  };
}

function resolveDominantCurrency(totalsByCurrency: Map<string, number>): string {
  if (totalsByCurrency.size === 0) {
    return "PLN";
  }

  let dominant = "PLN";
  let max = -1;

  for (const [currency, total] of totalsByCurrency) {
    if (total > max) {
      max = total;
      dominant = currency;
    }
  }

  return dominant;
}

function sumForCurrency(totalsByCurrency: Map<string, number>, currency: string): number {
  return totalsByCurrency.get(currency) ?? 0;
}

function computeTrendPercent(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 100);
}

function countInRange(dates: Date[], bounds: DateRangeBounds | null): number {
  if (!bounds) {
    return dates.length;
  }

  return dates.filter((date) => isDateInRange(date, bounds)).length;
}

function sumInRange(
  logs: Array<{ amount: number; currency: string; date: Date }>,
  bounds: DateRangeBounds | null,
  currency: string,
): number {
  return sumForCurrency(sumPaymentsInRange(logs, bounds), currency);
}

function chartGranularityForHorizon(horizon: DashboardTimeHorizon): DashboardChartGranularity {
  return horizon === "this_week" ? "daily" : "monthly";
}

function buildRequestsChartMetric(
  requests: RequestRow[],
  horizon: DashboardTimeHorizon,
  currentBounds: DateRangeBounds | null,
  previousBounds: DateRangeBounds | null,
  velocityBounds: DateRangeBounds,
  velocityPreviousBounds: DateRangeBounds,
): DashboardChartMetric {
  const dates = requests.map((request) => request.createdAt);
  const total = countInRange(dates, currentBounds);
  const granularity = chartGranularityForHorizon(horizon);

  const currentForTrend =
    currentBounds === null ? countInRange(dates, velocityBounds) : total;
  const previousForTrend =
    currentBounds === null
      ? countInRange(dates, velocityPreviousBounds)
      : countInRange(dates, previousBounds);

  const bars =
    granularity === "daily"
      ? bucketCountsByKeys(dates, currentWeekDayKeys(), toDayKey)
      : bucketCountsByKeys(dates, last12MonthKeys(), toMonthKey);

  return {
    total,
    trendPercent: computeTrendPercent(currentForTrend, previousForTrend),
    granularity,
    bars,
  };
}

function buildIncomeChartMetric(
  logs: Array<{ amount: number; currency: string; date: Date }>,
  horizon: DashboardTimeHorizon,
  currentBounds: DateRangeBounds | null,
  previousBounds: DateRangeBounds | null,
  velocityBounds: DateRangeBounds,
  velocityPreviousBounds: DateRangeBounds,
): DashboardChartMetric {
  const currentTotals = sumPaymentsInRange(logs, currentBounds);
  const currency = resolveDominantCurrency(currentTotals);
  const total = sumForCurrency(currentTotals, currency);
  const granularity = chartGranularityForHorizon(horizon);
  const currencyLogs = logs.filter((log) => log.currency === currency);

  const currentForTrend =
    currentBounds === null
      ? sumInRange(logs, velocityBounds, currency)
      : total;
  const previousForTrend =
    currentBounds === null
      ? sumInRange(logs, velocityPreviousBounds, currency)
      : sumInRange(logs, previousBounds, currency);

  const bars =
    granularity === "daily"
      ? bucketAmountsByKeys(currencyLogs, currentWeekDayKeys(), toDayKey)
      : bucketAmountsByKeys(currencyLogs, last12MonthKeys(), toMonthKey);

  return {
    total,
    currency,
    trendPercent: computeTrendPercent(currentForTrend, previousForTrend),
    granularity,
    bars,
  };
}

function countSentInRange(estimates: EstimateRow[], bounds: DateRangeBounds | null): number {
  if (!bounds) {
    return estimates.filter((estimate) => {
      const status = estimate.latestVersion?.status;
      return status != null && SENT_STATUSES.includes(status as (typeof SENT_STATUSES)[number]);
    }).length;
  }

  return estimates.filter((estimate) => {
    const lastSentAt = estimate.latestVersion?.lastSentAt;
    return lastSentAt != null && isDateInRange(lastSentAt, bounds);
  }).length;
}

function sumPaymentsInRange(
  logs: Array<{ amount: number; currency: string; date: Date }>,
  bounds: DateRangeBounds | null,
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const log of logs) {
    if (bounds && !isDateInRange(log.date, bounds)) {
      continue;
    }

    totals.set(log.currency, (totals.get(log.currency) ?? 0) + log.amount);
  }

  return totals;
}

function buildCountMetric(
  estimates: EstimateRow[],
  getDate: (estimate: EstimateRow) => Date | null,
  currentBounds: DateRangeBounds | null,
  previousBounds: DateRangeBounds | null,
  velocityBounds: DateRangeBounds,
  velocityPreviousBounds: DateRangeBounds,
  dayKeys: string[],
): { value: number; trendDelta: number; sparkline: number[] } {
  const value =
    currentBounds === null
      ? estimates.length
      : estimates.filter((estimate) => {
          const date = getDate(estimate);
          return date != null && isDateInRange(date, currentBounds);
        }).length;

  const trendDelta =
    currentBounds === null
      ? estimates.filter((estimate) => {
          const date = getDate(estimate);
          return date != null && isDateInRange(date, velocityBounds);
        }).length -
        estimates.filter((estimate) => {
          const date = getDate(estimate);
          return date != null && isDateInRange(date, velocityPreviousBounds);
        }).length
      : estimates.filter((estimate) => {
          const date = getDate(estimate);
          return date != null && isDateInRange(date, currentBounds!);
        }).length -
        estimates.filter((estimate) => {
          const date = getDate(estimate);
          return date != null && isDateInRange(date, previousBounds!);
        }).length;

  const sparklineDates = estimates
    .map((estimate) => getDate(estimate))
    .filter((date): date is Date => date != null);

  return {
    value,
    trendDelta,
    sparkline: bucketByDay(sparklineDates, dayKeys),
  };
}

function buildSentMetric(
  estimates: EstimateRow[],
  currentBounds: DateRangeBounds | null,
  previousBounds: DateRangeBounds | null,
  velocityBounds: DateRangeBounds,
  velocityPreviousBounds: DateRangeBounds,
  dayKeys: string[],
): { value: number; trendDelta: number; sparkline: number[] } {
  const value = countSentInRange(estimates, currentBounds);

  const trendDelta =
    currentBounds === null
      ? countSentInRange(
          estimates.filter((estimate) => {
            const date = estimate.latestVersion?.lastSentAt;
            return date != null && isDateInRange(date, velocityBounds);
          }),
          velocityBounds,
        ) -
        countSentInRange(
          estimates.filter((estimate) => {
            const date = estimate.latestVersion?.lastSentAt;
            return date != null && isDateInRange(date, velocityPreviousBounds);
          }),
          velocityPreviousBounds,
        )
      : countSentInRange(estimates, currentBounds) -
        countSentInRange(estimates, previousBounds);

  const sparklineDates = estimates
    .map((estimate) => estimate.latestVersion?.lastSentAt ?? null)
    .filter((date): date is Date => date != null);

  return {
    value,
    trendDelta,
    sparkline: bucketByDay(sparklineDates, dayKeys),
  };
}

function buildIncomeMetric(
  logs: Array<{ amount: number; currency: string; date: Date }>,
  currentBounds: DateRangeBounds | null,
  previousBounds: DateRangeBounds | null,
  velocityBounds: DateRangeBounds,
  velocityPreviousBounds: DateRangeBounds,
  dayKeys: string[],
): { value: number; currency: string; trendDelta: number; sparkline: number[] } {
  const currentTotals = sumPaymentsInRange(logs, currentBounds);
  const currency = resolveDominantCurrency(currentTotals);
  const value = sumForCurrency(currentTotals, currency);

  const trendDelta =
    currentBounds === null
      ? sumForCurrency(sumPaymentsInRange(logs, velocityBounds), currency) -
        sumForCurrency(sumPaymentsInRange(logs, velocityPreviousBounds), currency)
      : sumForCurrency(sumPaymentsInRange(logs, currentBounds), currency) -
        sumForCurrency(sumPaymentsInRange(logs, previousBounds), currency);

  return {
    value,
    currency,
    trendDelta,
    sparkline: bucketAmountsByDay(
      logs.filter((log) => log.currency === currency),
      dayKeys,
    ),
  };
}

function computeOverdueStats(installments: InstallmentRow[], dayKeys: string[]) {
  const overdueNow: Array<{ amount: number; currency: string }> = [];

  for (const row of installments) {
    const amount = Number(row.amount.toString());
    const paidAmount = Number(row.paidAmount.toString());
    const dueDate = row.dueDate?.toISOString() ?? null;

    if (
      isInstallmentOverdue({
        amount,
        paidAmount,
        dueDate,
      })
    ) {
      overdueNow.push({
        amount: getInstallmentRemainingAmount({ amount, paidAmount, dueDate }),
        currency: row.estimate.currency === "EUR" ? "EUR" : "PLN",
      });
    }
  }

  const totalsByCurrency = new Map<string, number>();
  for (const item of overdueNow) {
    totalsByCurrency.set(item.currency, (totalsByCurrency.get(item.currency) ?? 0) + item.amount);
  }

  const currency = resolveDominantCurrency(totalsByCurrency);
  const amount = sumForCurrency(totalsByCurrency, currency);

  const sparkline = dayKeys.map((dayKey) => {
    const dayEnd = startOfDay(new Date(`${dayKey}T00:00:00`));
    dayEnd.setHours(23, 59, 59, 999);

    let total = 0;
    for (const row of installments) {
      const rowCurrency = row.estimate.currency === "EUR" ? "EUR" : "PLN";
      if (rowCurrency !== currency) {
        continue;
      }

      const amountNum = Number(row.amount.toString());
      const paidAmount = Number(row.paidAmount.toString());
      const dueDate = row.dueDate;

      if (dueDate == null || dueDate.getTime() > dayEnd.getTime()) {
        continue;
      }

      if (paidAmount >= amountNum) {
        continue;
      }

      total += getInstallmentRemainingAmount({
        amount: amountNum,
        paidAmount,
        dueDate: dueDate.toISOString(),
      });
    }

    return total;
  });

  return { amount, count: overdueNow.length, currency, sparkline };
}

function buildHorizonStats(
  horizon: DashboardTimeHorizon,
  estimates: EstimateRow[],
  requests: RequestRow[],
  paymentLogs: Array<{ amount: number; currency: string; date: Date }>,
  periods: ReturnType<typeof resolveDashboardPeriodRanges>,
  dayKeys: string[],
): DashboardKpiHorizonStats {
  const horizonConfig: Record<
    DashboardTimeHorizon,
    { current: DateRangeBounds | null; previous: DateRangeBounds | null }
  > = {
    all: { current: null, previous: null },
    this_week: { current: periods.thisWeek, previous: periods.previousWeek },
    this_month: { current: periods.thisMonth, previous: periods.previousMonth },
    this_year: { current: periods.thisYear, previous: periods.previousYear },
  };

  const { current, previous } = horizonConfig[horizon];

  return {
    estimates: buildCountMetric(
      estimates,
      (estimate) => estimate.createdAt,
      current,
      previous,
      periods.last7Days,
      periods.previous7Days,
      dayKeys,
    ),
    sent: buildSentMetric(
      estimates,
      current,
      previous,
      periods.last7Days,
      periods.previous7Days,
      dayKeys,
    ),
    income: buildIncomeMetric(
      paymentLogs,
      current,
      previous,
      periods.last7Days,
      periods.previous7Days,
      dayKeys,
    ),
    requestsChart: buildRequestsChartMetric(
      requests,
      horizon,
      current,
      previous,
      periods.last7Days,
      periods.previous7Days,
    ),
    incomeChart: buildIncomeChartMetric(
      paymentLogs,
      horizon,
      current,
      previous,
      periods.last7Days,
      periods.previous7Days,
    ),
  };
}

async function loadDashboardKpiStats(workspaceId: string): Promise<DashboardKpiStats> {
  const [estimates, requests, paymentLogRows, installments] = await Promise.all([
    prisma.estimate.findMany({
      where: { workspaceId, deletedAt: null },
      select: {
        createdAt: true,
        latestVersion: {
          select: {
            lastSentAt: true,
            status: true,
          },
        },
      },
    }),
    prisma.estimateRequest.findMany({
      where: { workspaceId, deletedAt: null },
      select: {
        createdAt: true,
      },
    }),
    prisma.estimateActivityLog.findMany({
      where: {
        workspaceId,
        action: ESTIMATE_ACTIVITY_ACTIONS.payment_recorded,
      },
      select: {
        occurredAt: true,
        metadata: true,
      },
    }),
    prisma.paymentInstallment.findMany({
      where: {
        estimate: {
          workspaceId,
          deletedAt: null,
        },
      },
      select: {
        amount: true,
        paidAmount: true,
        dueDate: true,
        estimate: {
          select: {
            currency: true,
          },
        },
      },
    }),
  ]);

  const paymentLogs = paymentLogRows
    .map(parsePaymentLog)
    .filter((log): log is { amount: number; currency: string; date: Date } => log != null);

  const periods = resolveDashboardPeriodRanges();
  const dayKeys = last7DayKeys();

  const byHorizon = {
    all: buildHorizonStats("all", estimates, requests, paymentLogs, periods, dayKeys),
    this_week: buildHorizonStats("this_week", estimates, requests, paymentLogs, periods, dayKeys),
    this_month: buildHorizonStats("this_month", estimates, requests, paymentLogs, periods, dayKeys),
    this_year: buildHorizonStats("this_year", estimates, requests, paymentLogs, periods, dayKeys),
  };

  return {
    byHorizon,
    overdue: computeOverdueStats(installments, dayKeys),
  };
}

export const getDashboardKpiStats = cache(loadDashboardKpiStats);
