"use client";

import { Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { calculateEstimate, type LineItemCalcInput } from "@/features/estimates/lib/calculate-estimate";
import { estimateMobileStickyBarClass } from "@/features/estimates/lib/estimate-layout-config";
import { estimatePrimaryButtonClassName } from "./estimate-action-button-styles";
import { cn } from "@/lib/utils";

interface EstimateMobileStickyBarProps {
  items: LineItemCalcInput[];
  currency: string;
}

function formatCurrency(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function EstimateMobileStickyBar({ items, currency }: EstimateMobileStickyBarProps) {
  const t = useTranslations("estimates");
  const locale = useLocale();
  const calc = calculateEstimate(items, 0);

  return (
    <div
      className={cn(
        estimateMobileStickyBarClass,
        "fixed inset-x-0 bottom-0 z-50 items-center justify-between gap-4 border-t border-border/80 bg-card/95 px-4 py-3 backdrop-blur-sm",
      )}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{t("summary.gross")}</p>
        <p className="truncate text-lg font-semibold tabular-nums text-primary">
          {formatCurrency(calc.totalGross, currency, locale)}
        </p>
      </div>
      <Button type="button" size="sm" className={cn(estimatePrimaryButtonClassName, "shrink-0")}>
        {t("header.actions.sendEstimate")}
        <Send className="size-4" />
      </Button>
    </div>
  );
}
