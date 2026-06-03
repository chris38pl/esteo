"use client";



import { useLocale, useTranslations } from "next-intl";



import { calculateEstimate, type LineItemCalcInput } from "@/features/estimates/lib/calculate-estimate";

import { cn } from "@/lib/utils";

import { EstimateMarginControl } from "./estimate-margin-control";



interface EstimateRightRailProps {

  items: LineItemCalcInput[];

  marginPercent: number;

  currency?: string;

  onMarginChange: (value: number) => void;

  onMarginBlur: (value: number) => void;

  disabled?: boolean;

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

  return new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-US", {

    minimumFractionDigits: 1,

    maximumFractionDigits: 1,

  }).format(value) + "%";

}



export function EstimateRightRail({

  items,

  marginPercent,

  currency = "PLN",

  onMarginChange,

  onMarginBlur,

  disabled = false,

  className,

}: EstimateRightRailProps) {

  const t = useTranslations("estimates");

  const locale = useLocale();

  const calc = calculateEstimate(items, marginPercent);



  const rows: Array<{ label: string; value: string; highlight?: boolean }> = [

    {

      label: t("summary.net"),

      value: formatCurrency(calc.totalNet, currency, locale),

      highlight: true,

    },

    { label: t("summary.vat"), value: formatCurrency(calc.totalVat, currency, locale) },

    {

      label: t("summary.gross"),

      value: formatCurrency(calc.totalGross, currency, locale),

      highlight: true,

    },

  ];



  const profitRows: Array<{ label: string; value: string }> = [

    { label: t("summary.costBasis"), value: formatCurrency(calc.costBasis, currency, locale) },

    { label: t("summary.profit"), value: formatCurrency(calc.profit, currency, locale) },

    {

      label: t("summary.costRatio"),

      value: formatPercent(calc.costRatio * 100, locale),

    },

  ];



  return (

    <aside className={cn("space-y-4", className)}>

      <EstimateMarginControl

        marginPercent={marginPercent}

        onChange={onMarginChange}

        onBlur={onMarginBlur}

        disabled={disabled}

      />



      <div className="rounded-lg border bg-card p-4 space-y-2">

        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">

          {t("summary.title")}

        </p>

        {rows.map(({ label, value, highlight }) => (

          <div key={label} className="flex items-center justify-between">

            <span className={cn("text-sm", highlight && "font-medium")}>{label}</span>

            <span className={cn("text-sm tabular-nums", highlight && "font-semibold")}>

              {value}

            </span>

          </div>

        ))}

      </div>



      <div className="rounded-lg border bg-card p-4 space-y-2">

        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">

          {t("summary.profitability")}

        </p>

        {profitRows.map(({ label, value }) => (

          <div key={label} className="flex items-center justify-between">

            <span className="text-sm text-muted-foreground">{label}</span>

            <span className="text-sm tabular-nums font-medium">{value}</span>

          </div>

        ))}



        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">

          <div

            className="h-full rounded-full bg-primary/70 transition-all"

            style={{ width: `${Math.min(100, calc.costRatio * 100).toFixed(1)}%` }}

          />

        </div>

        <p className="text-xs text-muted-foreground">{t("summary.costRatioHint")}</p>

      </div>

    </aside>

  );

}

