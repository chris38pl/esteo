import type { DashboardTimeHorizon } from "@/features/dashboard/lib/dashboard-time-horizon";

export type DashboardKpiCountMetric = {
  value: number;
  trendDelta: number;
  sparkline: number[];
};

export type DashboardKpiIncomeMetric = {
  value: number;
  currency: string;
  trendDelta: number;
  sparkline: number[];
};

export type DashboardChartGranularity = "daily" | "monthly";

export type DashboardChartBar = {
  key: string;
  value: number;
};

export type DashboardChartMetric = {
  total: number;
  currency?: string;
  trendPercent: number;
  granularity: DashboardChartGranularity;
  bars: DashboardChartBar[];
};

export type DashboardKpiHorizonStats = {
  estimates: DashboardKpiCountMetric;
  sent: DashboardKpiCountMetric;
  income: DashboardKpiIncomeMetric;
  requestsChart: DashboardChartMetric;
  incomeChart: DashboardChartMetric;
};

export type DashboardKpiOverdueStats = {
  amount: number;
  count: number;
  currency: string;
  sparkline: number[];
};

export type DashboardKpiStats = {
  byHorizon: Record<DashboardTimeHorizon, DashboardKpiHorizonStats>;
  overdue: DashboardKpiOverdueStats;
};
