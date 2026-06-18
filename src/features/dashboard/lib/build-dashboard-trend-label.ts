import type { DashboardTimeHorizon } from "@/features/dashboard/lib/dashboard-time-horizon";
import { formatCurrency, type Currency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";

type TrendTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

function toCurrency(code: string): Currency {
  return code === "EUR" ? "EUR" : "PLN";
}

export function buildDashboardTrendLabel(input: {
  delta: number;
  horizon: DashboardTimeHorizon;
  variant: "count" | "currency";
  currency?: string;
  locale: Locale;
  t: TrendTranslator;
}): string {
  const { delta, horizon, variant, currency = "PLN", locale, t } = input;
  const isAll = horizon === "all";
  const absDelta = Math.abs(delta);

  if (delta === 0) {
    return isAll ? t("velocityFlat") : t("flat");
  }

  if (variant === "currency") {
    const amount = formatCurrency(absDelta, locale, toCurrency(currency));
    if (delta > 0) {
      return isAll ? t("velocityUpAmount", { amount }) : t("upAmount", { amount });
    }
    return isAll ? t("velocityDownAmount", { amount }) : t("downAmount", { amount });
  }

  if (delta > 0) {
    return isAll ? t("velocityUp", { delta: absDelta }) : t("up", { delta: absDelta });
  }

  return isAll ? t("velocityDown", { delta: absDelta }) : t("down", { delta: absDelta });
}

export function dashboardTrendTone(delta: number): "up" | "down" | "flat" {
  if (delta > 0) {
    return "up";
  }
  if (delta < 0) {
    return "down";
  }
  return "flat";
}

export function dashboardTrendClassName(delta: number): string {
  const tone = dashboardTrendTone(delta);
  if (tone === "up") {
    return "text-emerald-600 dark:text-emerald-400";
  }
  if (tone === "down") {
    return "text-red-600 dark:text-red-400";
  }
  return "text-muted-foreground";
}

export function normalizeSparkline(points: readonly number[]): number[] {
  if (points.length === 0) {
    return [0, 0];
  }
  if (points.every((value) => value === 0)) {
    return points.length >= 2 ? [...points] : [0, 0];
  }
  return [...points];
}
