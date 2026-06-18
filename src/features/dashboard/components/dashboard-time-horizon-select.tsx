"use client";

import { CalendarRange } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DASHBOARD_TIME_HORIZONS,
  type DashboardTimeHorizon,
} from "@/features/dashboard/lib/dashboard-time-horizon";

interface DashboardTimeHorizonSelectProps {
  value: DashboardTimeHorizon;
  onValueChange: (value: DashboardTimeHorizon) => void;
}

export function DashboardTimeHorizonSelect({
  value,
  onValueChange,
}: DashboardTimeHorizonSelectProps) {
  const t = useTranslations("dashboard.overview.timeHorizon");

  return (
    <Select value={value} onValueChange={(next) => onValueChange(next as DashboardTimeHorizon)}>
      <SelectTrigger className="w-[11.5rem] bg-card">
        <CalendarRange className="size-4 shrink-0 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {DASHBOARD_TIME_HORIZONS.map((horizon) => (
          <SelectItem key={horizon} value={horizon}>
            {t(horizon)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
