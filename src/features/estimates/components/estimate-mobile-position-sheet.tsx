"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { calculateLineItem } from "@/features/estimates/lib/calculate-estimate";
import { parseEstimateDecimalInput, roundEstimateDecimal } from "@/features/estimates/lib/estimate-decimals";
import { formatEstimateCurrency } from "@/features/estimates/lib/format-estimate-currency";
import { unitPriceFromBase } from "@/features/estimates/lib/margin-pricing";
import { estimatePrimaryButtonClassName } from "./estimate-action-button-styles";
import { estimateOutlineButtonClassName } from "./estimate-action-button-styles";
import type { LineItemData } from "./estimate-line-item-row";
import { cn } from "@/lib/utils";

interface EstimateMobilePositionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: LineItemData | null;
  positionLabel: string;
  currency: string;
  advancedMode: boolean;
  marginPercent: number;
  onSave: (itemId: string, data: Partial<Omit<LineItemData, "id" | "sortOrder">>) => void;
  onBlur: () => void;
}

function FieldRow({
  label,
  children,
  value,
  readOnly,
}: {
  label: string;
  children?: React.ReactNode;
  value?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children ?? (
        <div
          className={cn(
            "flex h-10 items-center rounded-lg border border-border/60 bg-muted/20 px-3 text-sm tabular-nums",
            readOnly && "text-muted-foreground",
          )}
        >
          {value}
        </div>
      )}
    </div>
  );
}

export function EstimateMobilePositionSheet({
  open,
  onOpenChange,
  item,
  positionLabel,
  currency,
  advancedMode,
  marginPercent,
  onSave,
  onBlur,
}: EstimateMobilePositionSheetProps) {
  const t = useTranslations("estimates");
  const locale = useLocale();
  const [draft, setDraft] = useState<LineItemData | null>(item);

  useEffect(() => {
    if (open && item) {
      setDraft(item);
    }
  }, [open, item]);

  if (!draft) return null;

  const calc = calculateLineItem({
    quantity: draft.quantity,
    unitPrice: draft.unitPrice,
    vatRate: draft.vatRate,
  });
  const costBasis = draft.quantity * draft.baseUnitPrice;
  const margin = calc.netValue - costBasis;

  const patch = (partial: Partial<LineItemData>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      if (advancedMode && partial.baseUnitPrice !== undefined) {
        next.unitPrice = unitPriceFromBase(next.baseUnitPrice, marginPercent);
      } else if (!advancedMode && partial.unitPrice !== undefined) {
        next.baseUnitPrice = next.unitPrice;
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!draft) return;
    onSave(draft.id, {
      name: draft.name,
      unit: draft.unit,
      quantity: draft.quantity,
      baseUnitPrice: draft.baseUnitPrice,
      unitPrice: draft.unitPrice,
      vatRate: draft.vatRate,
    });
    onBlur();
    onOpenChange(false);
  };

  const handleCancel = () => {
    setDraft(item);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[88dvh] gap-0 p-0" showCloseButton>
        <SheetHeader className="border-b border-border/60 pb-4">
          <p className="text-xs font-medium tabular-nums text-muted-foreground">{positionLabel}</p>
          <SheetTitle>{t("editor.mobile.editPosition")}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <FieldRow label={t("editor.columns.name")}>
            <Input
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder={t("editor.itemNamePlaceholder")}
              className="h-10"
            />
          </FieldRow>

          <div className="grid grid-cols-2 gap-3">
            <FieldRow label={t("editor.columns.unit")}>
              <Input
                value={draft.unit ?? ""}
                onChange={(e) => patch({ unit: e.target.value || null })}
                placeholder={t("editor.unitPlaceholder")}
                className="h-10"
              />
            </FieldRow>
            <FieldRow label={t("editor.columns.qty")}>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={draft.quantity}
                onChange={(e) => patch({ quantity: parseEstimateDecimalInput(e.target.value) })}
                onBlur={() => patch({ quantity: roundEstimateDecimal(draft.quantity) })}
                className="h-10 text-right tabular-nums"
              />
            </FieldRow>
          </div>

          {advancedMode ? (
            <FieldRow label={t("editor.columns.baseUnitPrice")}>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={draft.baseUnitPrice}
                onChange={(e) =>
                  patch({ baseUnitPrice: parseEstimateDecimalInput(e.target.value) })
                }
                onBlur={() =>
                  patch({ baseUnitPrice: roundEstimateDecimal(draft.baseUnitPrice) })
                }
                className="h-10 text-right tabular-nums"
              />
            </FieldRow>
          ) : null}

          <FieldRow
            label={t("editor.columns.unitPrice")}
            readOnly={advancedMode}
          >
            {advancedMode ? (
              <div className="flex h-10 items-center rounded-lg border border-border/60 bg-muted/20 px-3 text-sm tabular-nums text-muted-foreground">
                {formatEstimateCurrency(draft.unitPrice, currency, locale)}
              </div>
            ) : (
              <Input
                type="number"
                min={0}
                step={0.01}
                value={draft.unitPrice}
                onChange={(e) => patch({ unitPrice: parseEstimateDecimalInput(e.target.value) })}
                onBlur={() => patch({ unitPrice: roundEstimateDecimal(draft.unitPrice) })}
                className="h-10 text-right tabular-nums"
              />
            )}
          </FieldRow>

          <FieldRow
            label={t("editor.columns.vat")}
          >
            <Input
              type="number"
              min={0}
              max={100}
              step={1}
              value={(draft.vatRate * 100).toFixed(0)}
              onChange={(e) => patch({ vatRate: (parseFloat(e.target.value) || 0) / 100 })}
              className="h-10 text-right tabular-nums"
            />
          </FieldRow>

          <div className="rounded-xl border border-border/60 bg-muted/15 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("editor.columns.net")}</span>
              <span className="font-medium tabular-nums">
                {formatEstimateCurrency(calc.netValue, currency, locale)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("editor.columns.gross")}</span>
              <span className="font-semibold tabular-nums text-primary">
                {formatEstimateCurrency(calc.grossValue, currency, locale)}
              </span>
            </div>
            {advancedMode ? (
              <>
                <div className="border-t border-border/50 pt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t("editor.mobile.cost")}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatEstimateCurrency(costBasis, currency, locale)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t("editor.mobile.margin")}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatEstimateCurrency(margin, currency, locale)}
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <SheetFooter className="pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button type="button" variant="outline" className={estimateOutlineButtonClassName} onClick={handleCancel}>
            {t("editor.mobile.cancel")}
          </Button>
          <Button type="button" className={estimatePrimaryButtonClassName} onClick={handleSave}>
            {t("editor.mobile.save")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
