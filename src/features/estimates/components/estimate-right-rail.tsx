"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { calculateEstimate, type LineItemCalcInput } from "@/features/estimates/lib/calculate-estimate";
import { roundEstimateDecimal } from "@/features/estimates/lib/estimate-decimals";
import { ESTIMATE_LAYOUT_CONFIG } from "@/features/estimates/lib/estimate-layout-config";
import {
  formatDecimalInputDisplay,
  isValidDecimalDraft,
  parseDecimalInput,
} from "@/lib/decimal-input";
import { cn } from "@/lib/utils";

interface EstimateRightRailProps {
  items: LineItemCalcInput[];
  marginPercent: number;
  onMarginChange?: (value: number) => void;
  onMarginBlur?: (value: number) => void;
  readOnly?: boolean;
  currency?: string;
  advancedMode: boolean;
  className?: string;
}

const profitabilityMarginBadgeClassName =
  "inline-flex shrink-0 items-baseline rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary tabular-nums";

const profitabilityMarginInputClassName =
  "m-0 inline-block w-[2.75rem] min-w-0 max-w-full border-0 bg-transparent p-0 text-right text-xs font-semibold tabular-nums text-primary shadow-none outline-none ring-0 appearance-none rounded-none focus:outline-none focus:ring-0 dark:bg-transparent";

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

function RailCardHeader({ title, badge }: { title: string; badge?: ReactNode }) {
  return (
    <div className={cn("relative", badge != null && "pr-16")}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">
        {title}
      </p>
      {badge != null ? (
        <span className="absolute top-0 right-0">{badge}</span>
      ) : null}
    </div>
  );
}

function ProfitabilityMarginBadge({
  marginPercent,
  onMarginChange,
  onMarginBlur,
  readOnly,
  locale,
}: {
  marginPercent: number;
  onMarginChange?: (value: number) => void;
  onMarginBlur?: (value: number) => void;
  readOnly?: boolean;
  locale: string;
}) {
  const t = useTranslations("estimates");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const originalMarginRef = useRef(marginPercent);

  const clampMargin = (value: number) => {
    const rounded = roundEstimateDecimal(value);
    return Math.min(100, Math.max(0, rounded));
  };

  const finishEditing = (revert = false) => {
    if (revert) {
      onMarginChange?.(originalMarginRef.current);
      setEditing(false);
      setDraft(null);
      return;
    }

    const committed = clampMargin(parseDecimalInput(draft ?? String(marginPercent), 2));
    onMarginChange?.(committed);
    onMarginBlur?.(committed);
    setEditing(false);
    setDraft(null);
  };

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  if (readOnly || !onMarginChange || !onMarginBlur) {
    return (
      <span className={profitabilityMarginBadgeClassName}>
        {formatPercent(marginPercent, locale)}
      </span>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        className={cn(profitabilityMarginBadgeClassName, "cursor-text")}
        aria-label={t("profitability.projectMargin")}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          originalMarginRef.current = marginPercent;
          setDraft(formatDecimalInputDisplay(marginPercent, { emptyZero: false, maxPlaces: 2 }));
          setEditing(true);
        }}
      >
        {formatPercent(marginPercent, locale)}
      </button>
    );
  }

  const display =
    draft ?? formatDecimalInputDisplay(marginPercent, { emptyZero: false, maxPlaces: 2 });

  return (
    <span
      className={profitabilityMarginBadgeClassName}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={display}
        aria-label={t("profitability.projectMargin")}
        className={cn(
          profitabilityMarginInputClassName,
          "estimate-profitability-margin-badge__input",
        )}
        onChange={(event) => {
          const raw = event.target.value;
          if (!isValidDecimalDraft(raw)) {
            return;
          }

          setDraft(raw);

          if (raw === "" || raw === "." || raw === ",") {
            onMarginChange(0);
            return;
          }

          onMarginChange(clampMargin(parseDecimalInput(raw, 2)));
        }}
        onBlur={() => finishEditing()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            finishEditing();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            finishEditing(true);
          }
        }}
      />
      {t("margin.unit")}
    </span>
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
      <RailCardHeader title={t("summary.title")} />
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
  onMarginChange,
  onMarginBlur,
  readOnly,
  currency,
  locale,
}: {
  items: LineItemCalcInput[];
  marginPercent: number;
  onMarginChange?: (value: number) => void;
  onMarginBlur?: (value: number) => void;
  readOnly?: boolean;
  currency: string;
  locale: string;
}) {
  const t = useTranslations("estimates");
  const calc = calculateEstimate(items, marginPercent);
  const profitabilityPercent = Math.min(100, Math.max(0, calc.profitMarginOnNetPercent));

  return (
    <TooltipProvider delayDuration={200}>
      <div className="estimate-right-rail__profitability flex min-h-[8.75rem] min-w-0 flex-1 flex-col bg-muted/20 p-4 dark:bg-muted/10 xl:px-5">
        <RailCardHeader
          title={t("profitability.title")}
          badge={
            <ProfitabilityMarginBadge
              marginPercent={marginPercent}
              onMarginChange={onMarginChange}
              onMarginBlur={onMarginBlur}
              readOnly={readOnly}
              locale={locale}
            />
          }
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="mt-3 cursor-help space-y-2 outline-none">
              <SummaryRow
                label={t("profitability.profitabilityRate")}
                value={formatPercent(profitabilityPercent, locale)}
              />
              <SummaryRow
                label={t("profitability.cost")}
                value={formatCurrency(calc.costBasis, currency, locale)}
              />
              <div className="border-t border-border/60 pt-2">
                <SummaryRow
                  label={t("profitability.profit")}
                  value={formatCurrency(calc.profit, currency, locale)}
                  emphasized
                />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[240px] text-center">
            {t("profitability.tooltip")}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export function EstimateRightRail({
  items,
  marginPercent,
  onMarginChange,
  onMarginBlur,
  readOnly = false,
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
              onMarginChange={onMarginChange}
              onMarginBlur={onMarginBlur}
              readOnly={readOnly}
              currency={currency}
              locale={locale}
            />
          ) : null}
        </div>
      </section>
    </aside>
  );
}
