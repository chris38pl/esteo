"use client";

import { memo } from "react";
import { useLocale, useTranslations } from "next-intl";

import { calculateLineItem } from "@/features/estimates/lib/calculate-estimate";
import { formatEstimateCurrency, formatEstimateDecimal } from "@/features/estimates/lib/format-estimate-currency";
import { cn } from "@/lib/utils";
import type { LineItemData } from "./estimate-line-item-row";

interface EstimateMobilePositionCardProps {
  item: LineItemData;
  positionLabel: string;
  currency: string;
  advancedMode: boolean;
  onOpen: () => void;
}

function EstimateMobilePositionCardComponent({
  item,
  positionLabel,
  currency,
  advancedMode,
  onOpen,
}: EstimateMobilePositionCardProps) {
  const t = useTranslations("estimates");
  const locale = useLocale();
  const calc = calculateLineItem({
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    vatRate: item.vatRate,
  });
  const costBasis = item.quantity * item.baseUnitPrice;

  const metaParts = [
    formatEstimateDecimal(item.quantity, locale),
    item.unit ?? "—",
    formatEstimateCurrency(item.unitPrice, currency, locale),
  ];

  return (
    <div
      className={cn(
        "group relative border-b border-border/40 last:border-b-0",
        "transition-colors active:bg-muted/20",
      )}
    >
      <button
        type="button"
        className="flex w-full min-w-0 gap-2 px-3 py-2.5 text-left"
        onClick={onOpen}
      >
        <span className="w-7 shrink-0 pt-px text-xs font-medium tabular-nums text-muted-foreground">
          {positionLabel}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
              {item.name || t("editor.itemNamePlaceholder")}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
              {formatEstimateCurrency(calc.grossValue, currency, locale)}
            </span>
          </span>
          <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
            {metaParts.join(" × ")}
          </span>
          {advancedMode && costBasis > 0 ? (
            <span className="mt-0.5 block text-[11px] tabular-nums text-muted-foreground/75">
              {formatEstimateCurrency(costBasis, currency, locale)}
              {" → "}
              {formatEstimateCurrency(calc.grossValue, currency, locale)}
            </span>
          ) : null}
        </span>
      </button>
    </div>
  );
}

export const EstimateMobilePositionCard = memo(EstimateMobilePositionCardComponent);
