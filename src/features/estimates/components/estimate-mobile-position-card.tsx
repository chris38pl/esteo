"use client";

import { memo } from "react";
import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function EstimateMobilePositionCardComponent({
  item,
  positionLabel,
  currency,
  advancedMode,
  onOpen,
  onEdit,
  onDuplicate,
  onDelete,
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
        "group relative rounded-xl border border-border/60 bg-card/80 px-3.5 py-3",
        "transition-colors active:bg-muted/30",
      )}
    >
      <button
        type="button"
        className="flex w-full min-w-0 flex-col gap-1.5 text-left"
        onClick={onOpen}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tabular-nums text-muted-foreground">
              {positionLabel}
            </p>
            <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
              {item.name || t("editor.itemNamePlaceholder")}
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
            {formatEstimateCurrency(calc.grossValue, currency, locale)}
          </p>
        </div>
        <p className="text-xs tabular-nums text-muted-foreground">
          {metaParts.join(" × ")}
        </p>
        {advancedMode && costBasis > 0 ? (
          <p className="text-[11px] tabular-nums text-muted-foreground/80">
            {formatEstimateCurrency(costBasis, currency, locale)}
            {" → "}
            {formatEstimateCurrency(calc.grossValue, currency, locale)}
          </p>
        ) : null}
      </button>

      <div className="absolute top-2.5 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-8 rounded-lg text-muted-foreground"
              aria-label={t("editor.mobile.positionActions")}
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit} className="gap-2">
              <Pencil className="size-4" />
              {t("editor.mobile.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate} className="gap-2">
              <Copy className="size-4" />
              {t("editor.mobile.duplicate")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive">
              <Trash2 className="size-4" />
              {t("editor.deleteItem")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export const EstimateMobilePositionCard = memo(EstimateMobilePositionCardComponent);
