"use client";

import { useLocale, useTranslations } from "next-intl";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { calculateEstimate, type LineItemCalcInput } from "@/features/estimates/lib/calculate-estimate";
import { ESTIMATE_LAYOUT_CONFIG } from "@/features/estimates/lib/estimate-layout-config";
import { cn } from "@/lib/utils";

interface EstimateRightRailProps {
  items: LineItemCalcInput[];
  marginPercent: number;
  currency?: string;
  advancedMode: boolean;
  className?: string;
}

function formatCurrency(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number, locale: string): string {
  return `${new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

function SummaryRow({ label, value, emphasized }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "tabular-nums",
          emphasized ? "text-sm font-semibold text-primary" : "text-xs font-semibold",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function SummaryCard({
  items,
  currency,
  locale,
}: {
  items: LineItemCalcInput[];
  currency: string;
  locale: string;
}) {
  const t = useTranslations("estimates");
  const calc = calculateEstimate(items, 0);

  return (
    <div className="estimate-right-rail__summary flex min-h-[8.75rem] min-w-0 flex-1 flex-col bg-card/95 p-4 xl:px-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">
        {t("summary.title")}
      </p>
      <div className="mt-3 space-y-2">
        <SummaryRow
          label={t("summary.net")}
          value={formatCurrency(calc.totalNet, currency, locale)}
        />
        <SummaryRow
          label={t("summary.vat")}
          value={formatCurrency(calc.totalVat, currency, locale)}
        />
        <div className="border-t border-border/60 pt-2">
          <SummaryRow
            label={t("summary.gross")}
            value={formatCurrency(calc.totalGross, currency, locale)}
            emphasized
          />
        </div>
      </div>
    </div>
  );
}

function ProfitabilityCard({
  items,
  marginPercent,
  currency,
  locale,
}: {
  items: LineItemCalcInput[];
  marginPercent: number;
  currency: string;
  locale: string;
}) {
  const t = useTranslations("estimates");
  const calc = calculateEstimate(items, marginPercent);
  const profitabilityPercent = Math.min(100, Math.max(0, calc.profitMarginOnNetPercent));

  const rows: Array<{ label: string; value: string }> = [
    {
      label: t("profitability.projectMargin"),
      value: formatPercent(marginPercent, locale),
    },
    {
      label: t("profitability.cost"),
      value: formatCurrency(calc.costBasis, currency, locale),
    },
    {
      label: t("profitability.profit"),
      value: formatCurrency(calc.profit, currency, locale),
    },
    {
      label: t("profitability.profitabilityRate"),
      value: formatPercent(calc.profitMarginOnNetPercent, locale),
    },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="estimate-right-rail__profitability flex min-h-[8.75rem] min-w-0 flex-1 cursor-help flex-col bg-muted/20 p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/60 dark:bg-muted/10 xl:px-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">
                {t("profitability.title")}
              </p>
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary tabular-nums">
                {formatPercent(profitabilityPercent, locale)}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {rows.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-semibold tabular-nums">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${profitabilityPercent.toFixed(1)}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[240px] text-center">
          {t("profitability.tooltip")}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function EstimateRightRail({
  items,
  marginPercent,
  currency = "PLN",
  advancedMode,
  className,
}: EstimateRightRailProps) {
  const locale = useLocale();

  return (
    <aside className={cn("estimate-side-rail h-full w-full min-w-0", className)}>
      <section className="flex h-full min-h-[8.75rem] w-full min-w-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-sm">
        <div
          className={cn(
            "h-full w-full min-w-0",
            advancedMode && ESTIMATE_LAYOUT_CONFIG.tailwind.rightRailAdvancedGrid,
          )}
        >
          <SummaryCard items={items} currency={currency} locale={locale} />
          {advancedMode ? (
            <ProfitabilityCard
              items={items}
              marginPercent={marginPercent}
              currency={currency}
              locale={locale}
            />
          ) : null}
        </div>
      </section>
    </aside>
  );
}
