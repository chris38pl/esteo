"use client";

import { Percent } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { formatEstimateDecimal } from "@/features/estimates/lib/format-estimate-currency";
import { cn } from "@/lib/utils";

interface EstimateMobileMarginBadgeProps {
  marginPercent: number;
  className?: string;
}

export function EstimateMobileMarginBadge({
  marginPercent,
  className,
}: EstimateMobileMarginBadgeProps) {
  const t = useTranslations("estimates");
  const locale = useLocale();
  const formatted = formatEstimateDecimal(marginPercent, locale);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1",
        "bg-muted/45 text-[11px] font-medium tabular-nums text-muted-foreground",
        "dark:bg-blue-950/55 dark:text-muted-foreground",
        className,
      )}
      aria-label={t("editor.mobile.marginBadgeAria", { value: formatted })}
    >
      <Percent className="size-3.5 shrink-0 opacity-70" aria-hidden />
      <span className="whitespace-nowrap">{t("editor.mobile.marginBadge", { value: formatted })}</span>
    </span>
  );
}
