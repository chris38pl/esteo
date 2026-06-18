"use client";

import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DASHBOARD_CHART_PERIODS,
  type DashboardChartPeriod,
} from "@/features/dashboard/lib/dashboard-overview-types";

interface DashboardChartPeriodSelectProps {
  value: DashboardChartPeriod;
  onValueChange: (value: DashboardChartPeriod) => void;
}

export function DashboardChartPeriodSelect({
  value,
  onValueChange,
}: DashboardChartPeriodSelectProps) {
  const t = useTranslations("dashboard.overview.charts.period");

  return (
    <Select value={value} onValueChange={(next) => onValueChange(next as DashboardChartPeriod)}>
      <SelectTrigger className="h-8 w-[6.5rem] border-border/60 bg-card text-xs shadow-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {DASHBOARD_CHART_PERIODS.map((period) => (
          <SelectItem key={period} value={period}>
            {t(period)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
