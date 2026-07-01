"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import {
  ArrowLeft,
  Check,
  Coins,
  Copy,
  FileText,
  Hash,
  Percent,
  Receipt,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet";
import { DecimalInput, PercentInput } from "@/components/ui/decimal-input";
import { calculateLineItem } from "@/features/estimates/lib/calculate-estimate";
import { roundEstimateDecimal } from "@/features/estimates/lib/estimate-decimals";
import { formatEstimateCurrency } from "@/features/estimates/lib/format-estimate-currency";
import { unitPriceFromBase } from "@/features/estimates/lib/margin-pricing";
import type { AutoSaveStatus } from "@/features/estimates/hooks/use-estimate-autosave";
import { devTime, devTimeEnd, devPerfLog } from "@/features/estimates/lib/dev-perf";
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
  onPersistItem: (
    itemId: string,
    data: Partial<Omit<LineItemData, "id" | "sortOrder">>,
  ) => Promise<void>;
  onDuplicate: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  onBlur: () => void | Promise<void>;
  autosaveStatus?: AutoSaveStatus;
  readOnly?: boolean;
}

const editRowClassName = "flex gap-3 py-2.5 pl-[22px] pr-[22px]";

const fieldInputClassName =
  "estimate-mobile-position-field m-0 h-auto min-h-0 appearance-none border-none bg-transparent p-0 text-sm font-medium text-foreground shadow-none outline-none ring-0";

const fieldValueClassName = "w-20 text-right tabular-nums";

function EditRowIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <span className="estimate-mobile-position-icon flex size-9 shrink-0 items-center justify-center rounded-lg">
      <Icon className="size-4 text-primary dark:text-muted-foreground" aria-hidden />
    </span>
  );
}

function NameEditRow({
  label,
  value,
  placeholder,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className={cn(editRowClassName, "items-start")}>
      <EditRowIcon icon={FileText} />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(fieldInputClassName, "mt-0.5 w-full")}
        />
      </div>
    </div>
  );
}

function ValueEditRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(editRowClassName, "items-center")}>
      <EditRowIcon icon={Icon} />
      <p className="min-w-0 flex-1 text-sm text-muted-foreground">{label}</p>
      <div className="flex shrink-0 items-center gap-1">{children}</div>
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
  onPersistItem,
  onDuplicate,
  onDelete,
  onBlur,
  autosaveStatus = "idle",
  readOnly = false,
}: EstimateMobilePositionSheetProps) {
  const t = useTranslations("estimates");
  const locale = useLocale();
  const [draft, setDraft] = useState<LineItemData | null>(item);
  const [isSaveInProgress, setIsSaveInProgress] = useState(false);
  const [isDuplicateInProgress, setIsDuplicateInProgress] = useState(false);
  const [isDeleteInProgress, setIsDeleteInProgress] = useState(false);

  useEffect(() => {
    if (open && item) {
      setDraft(item);
    }
  }, [open, item]);

  useEffect(() => {
    if (open) {
      devPerfLog("mobile sheet opened");
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setIsSaveInProgress(false);
      setIsDuplicateInProgress(false);
      setIsDeleteInProgress(false);
    }
  }, [open]);

  const isBusy =
    isSaveInProgress ||
    isDuplicateInProgress ||
    isDeleteInProgress ||
    autosaveStatus === "saving";
  const effectiveDraft = draft ?? item;

  if (!effectiveDraft) return null;

  const calc = calculateLineItem({
    quantity: effectiveDraft.quantity,
    unitPrice: effectiveDraft.unitPrice,
    vatRate: effectiveDraft.vatRate,
  });
  const costBasis = effectiveDraft.quantity * effectiveDraft.baseUnitPrice;
  const margin = calc.netValue - costBasis;

  const patch = (partial: Partial<LineItemData>) => {
    if (readOnly) return;
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

  const draftPayload = (): Partial<Omit<LineItemData, "id" | "sortOrder">> => ({
    name: effectiveDraft.name,
    unit: effectiveDraft.unit,
    quantity: effectiveDraft.quantity,
    baseUnitPrice: effectiveDraft.baseUnitPrice,
    unitPrice: effectiveDraft.unitPrice,
    vatRate: effectiveDraft.vatRate,
  });

  const handleSave = async () => {
    if (!effectiveDraft || isBusy) return;
    flushSync(() => setIsSaveInProgress(true));
    devTime("handleSave");
    try {
      await onPersistItem(effectiveDraft.id, draftPayload());
      onOpenChange(false);
    } finally {
      devTimeEnd("handleSave");
      setIsSaveInProgress(false);
    }
  };

  const handleCancel = () => {
    if (isBusy) return;
    setDraft(item);
    onOpenChange(false);
  };

  const handleDuplicate = async () => {
    if (!effectiveDraft || isBusy) return;
    flushSync(() => setIsDuplicateInProgress(true));
    devTime("handleDuplicate");
    try {
      await onPersistItem(effectiveDraft.id, draftPayload());
      await onDuplicate();
      onOpenChange(false);
    } finally {
      devTimeEnd("handleDuplicate");
      setIsDuplicateInProgress(false);
    }
  };

  const handleDelete = async () => {
    if (isBusy) return;
    flushSync(() => setIsDeleteInProgress(true));
    devTime("handleDelete");
    try {
      await onDelete();
      onOpenChange(false);
    } finally {
      devTimeEnd("handleDelete");
      setIsDeleteInProgress(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="z-[80] inset-0 h-dvh max-h-dvh gap-0 rounded-none border-0 bg-card/95 p-0 shadow-none"
        overlayClassName="z-[80]"
        showCloseButton={false}
      >
        <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-border/40 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground"
            aria-label={t("editor.mobile.cancel")}
            onClick={handleCancel}
            disabled={isBusy}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1">
            <div className="flex min-w-0 items-center justify-center gap-2">
              <SheetTitle className="truncate text-base font-semibold">
                {t("editor.mobile.editPosition")}
              </SheetTitle>
              <span className="estimate-mobile-position-icon shrink-0 rounded-md px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                {positionLabel}
              </span>
            </div>
            {autosaveStatus === "saved" ? (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="size-3" />
                {t("editor.mobile.saved")}
              </span>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground"
            aria-label={t("editor.mobile.cancel")}
            onClick={handleCancel}
            disabled={isBusy}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-border/40">
          <NameEditRow
            label={t("editor.columns.name")}
            value={effectiveDraft.name}
            placeholder={t("editor.itemNamePlaceholder")}
            onChange={(name) => patch({ name })}
            disabled={readOnly}
          />

          <ValueEditRow icon={Tag} label={t("editor.columns.unit")}>
            <input
              value={effectiveDraft.unit ?? ""}
              onChange={(e) => patch({ unit: e.target.value || null })}
              placeholder={t("editor.unitPlaceholder")}
              disabled={readOnly}
              className={cn(fieldInputClassName, fieldValueClassName)}
            />
          </ValueEditRow>

          <ValueEditRow icon={Hash} label={t("editor.columns.qty")}>
            <DecimalInput
              min={0}
              value={effectiveDraft.quantity}
              onValueChange={(quantity) => patch({ quantity })}
              onBlurCommit={() =>
                patch({ quantity: roundEstimateDecimal(effectiveDraft.quantity) })
              }
              disabled={readOnly}
              className={cn(fieldInputClassName, fieldValueClassName)}
            />
          </ValueEditRow>

          {advancedMode ? (
            <ValueEditRow icon={Receipt} label={t("editor.columns.baseUnitPrice")}>
              <DecimalInput
                min={0}
                value={effectiveDraft.baseUnitPrice}
                onValueChange={(baseUnitPrice) => patch({ baseUnitPrice })}
                onBlurCommit={() =>
                  patch({ baseUnitPrice: roundEstimateDecimal(effectiveDraft.baseUnitPrice) })
                }
                disabled={readOnly}
                className={cn(fieldInputClassName, fieldValueClassName)}
              />
            </ValueEditRow>
          ) : null}

          <ValueEditRow icon={Coins} label={t("editor.columns.unitPrice")}>
            {advancedMode ? (
              <span className="text-sm font-medium tabular-nums text-foreground">
                {formatEstimateCurrency(effectiveDraft.unitPrice, currency, locale)}
              </span>
            ) : (
              <DecimalInput
                min={0}
                value={effectiveDraft.unitPrice}
                onValueChange={(unitPrice) => patch({ unitPrice })}
                onBlurCommit={() =>
                  patch({ unitPrice: roundEstimateDecimal(effectiveDraft.unitPrice) })
                }
                disabled={readOnly}
                className={cn(fieldInputClassName, fieldValueClassName)}
              />
            )}
          </ValueEditRow>

          <ValueEditRow icon={Percent} label={t("editor.mobile.vatPercent")}>
            <PercentInput
              value={effectiveDraft.vatRate}
              onValueChange={(vatRate) => patch({ vatRate })}
              emptyZero={false}
              disabled={readOnly}
              className={cn(fieldInputClassName, fieldValueClassName)}
            />
          </ValueEditRow>
          </div>

          <div
            className={cn(
              "mx-4 mt-4 space-y-2 rounded-xl border border-border/60 bg-muted/15 px-4",
              advancedMode ? "py-4" : "py-6",
            )}
          >
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

        {!readOnly ? (
          <SheetFooter className="flex-col gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className={cn(estimateOutlineButtonClassName, "flex-1")}
                onClick={handleDuplicate}
                disabled={isBusy}
              >
                <Copy className="size-4" />
                {isDuplicateInProgress
                  ? t("editor.mobile.duplicating")
                  : t("editor.mobile.duplicate")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  estimateOutlineButtonClassName,
                  "flex-1 border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive",
                )}
                onClick={handleDelete}
                disabled={isBusy}
              >
                <Trash2 className="size-4" />
                {isDeleteInProgress ? t("editor.mobile.removing") : t("editor.mobile.remove")}
              </Button>
            </div>
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className={cn(estimateOutlineButtonClassName, "flex-1")}
                onClick={handleCancel}
                disabled={isBusy}
              >
                {t("editor.mobile.cancel")}
              </Button>
              <Button
                type="button"
                className={cn(estimatePrimaryButtonClassName, "flex-1")}
                onClick={handleSave}
                disabled={isBusy}
              >
                {isSaveInProgress ? t("editor.mobile.saving") : t("editor.mobile.save")}
              </Button>
            </div>
          </SheetFooter>
        ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
