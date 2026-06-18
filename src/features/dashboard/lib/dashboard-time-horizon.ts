export const DASHBOARD_TIME_HORIZONS = [
  "all",
  "this_week",
  "this_month",
  "this_year",
] as const;

export type DashboardTimeHorizon = (typeof DASHBOARD_TIME_HORIZONS)[number];

export const DEFAULT_DASHBOARD_TIME_HORIZON: DashboardTimeHorizon = "all";
