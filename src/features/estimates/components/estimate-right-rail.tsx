"use client";

import { useLocale, useTranslations } from "next-intl";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { calculateEstimate, type LineItemCalcInput } from "@/features/estimates/lib/calculate-estimate";
import { cn } from "@/lib/utils";

interface EstimateRightRailProps {
  items: LineItemCalcInput[];
  marginPercent: number;
  currency?: string;
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
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
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

export function EstimateRightRail({
  items,
  marginPercent,
  currency = "PLN",
  className,
}: EstimateRightRailProps) {
  const t = useTranslations("estimates");
  const locale = useLocale();
  const calc = calculateEstimate(items, marginPercent);
  const costRatioPercent = Math.min(100, calc.costRatio * 100);

  const profitRows: Array<{ label: string; value: string }> = [
    { label: t("summary.costBasis"), value: formatCurrency(calc.costBasis, currency, locale) },
    { label: t("summary.profit"), value: formatCurrency(calc.profit, currency, locale) },
    {
      label: t("summary.costRatio"),
      value: formatPercent(calc.costRatio * 100, locale),
    },
  ];

  return (
    <aside className={cn("h-full min-w-0", className)}>
      <section className="h-full min-w-0 overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-sm">
        <div className="grid h-full min-w-0 divide-y divide-border/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="flex min-w-0 flex-col bg-card/95 p-4 xl:px-5">
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

          <div className="flex min-w-0 flex-col bg-card/95 p-4 xl:px-5">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="flex min-h-0 min-w-0 flex-1 cursor-help flex-col rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                    aria-label={t("summary.costRatioHint")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">
                        {t("summary.profitability")}
                      </p>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {formatPercent(calc.costRatio * 100, locale)}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {profitRows.map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between gap-4">
                          <span className="text-xs text-muted-foreground">{label}</span>
                          <span className="text-xs font-semibold tabular-nums">{value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${costRatioPercent.toFixed(1)}%` }}
                      />
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[240px] text-center">
                  {t("summary.costRatioHint")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </section>
    </aside>
  );
}
