"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Coins, FileText, Percent, Tag, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  estimateOutlineButtonClassName,
  estimatePrimaryButtonClassName,
} from "@/features/estimates/components/estimate-action-button-styles";
import type { TemplateItemDraft } from "@/features/estimate-templates/lib/template-editor-draft";
import type { TemplateAutoSaveStatus } from "@/features/estimate-templates/hooks/use-template-autosave";
import { normalizeTemplateDecimalInput } from "@/features/estimate-templates/lib/template-pricing";
import { cn } from "@/lib/utils";

type TemplateItemEditableFields = Pick<
  TemplateItemDraft,
  "name" | "unit" | "unitPrice" | "vatRate" | "note"
>;

interface TemplateMobilePositionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: TemplateItemDraft | null;
  positionLabel: string;
  currency: string;
  onPersistItem: (itemId: string, data: Partial<TemplateItemEditableFields>) => void;
  onDelete: () => void;
  onBlur: () => void | Promise<void>;
  autosaveStatus?: TemplateAutoSaveStatus;
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
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={cn(editRowClassName, "items-start")}>
      <EditRowIcon icon={FileText} />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
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

export function TemplateMobilePositionSheet({
  open,
  onOpenChange,
  item,
  positionLabel,
  currency,
  onPersistItem,
  onDelete,
  onBlur,
  autosaveStatus = "idle",
}: TemplateMobilePositionSheetProps) {
  const t = useTranslations("workspaces.configuration.templates.editor");
  const tEst = useTranslations("estimates");
  const [local, setLocal] = useState<TemplateItemDraft | null>(item);
  const [isSaveInProgress, setIsSaveInProgress] = useState(false);
  const [isDeleteInProgress, setIsDeleteInProgress] = useState(false);

  useEffect(() => {
    if (open && item) {
      setLocal(item);
    }
  }, [open, item]);

  useEffect(() => {
    if (!open) {
      setIsSaveInProgress(false);
      setIsDeleteInProgress(false);
    }
  }, [open]);

  const isBusy =
    isSaveInProgress || isDeleteInProgress || autosaveStatus === "saving";

  if (!local) return null;

  const handleCancel = () => {
    if (isBusy) return;
    setLocal(item);
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (isBusy) return;
    setIsSaveInProgress(true);
    try {
      await onBlur();
      onOpenChange(false);
    } finally {
      setIsSaveInProgress(false);
    }
  };

  const handleDelete = async () => {
    if (isBusy) return;
    setIsDeleteInProgress(true);
    try {
      onDelete();
      onOpenChange(false);
    } finally {
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
              onClick={handleCancel}
              disabled={isBusy}
              aria-label={tEst("editor.mobile.cancel")}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1">
              <div className="flex min-w-0 items-center justify-center gap-2">
                <SheetTitle className="truncate text-base font-semibold">
                  {tEst("editor.mobile.editPosition")}
                </SheetTitle>
                <span className="estimate-mobile-position-icon shrink-0 rounded-md px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                  {positionLabel}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 text-muted-foreground"
              onClick={handleCancel}
              disabled={isBusy}
              aria-label={tEst("editor.mobile.cancel")}
            >
              <X className="size-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-border/40">
              <NameEditRow
                label={t("columnName")}
                value={local.name}
                placeholder={t("itemNamePlaceholder")}
                onChange={(name) => {
                  setLocal((prev) => (prev ? { ...prev, name } : prev));
                  onPersistItem(local.id, { name });
                }}
              />

              <ValueEditRow icon={Tag} label={t("columnUnit")}>
                <input
                  value={local.unit}
                  onChange={(event) => {
                    const unit = event.target.value;
                    setLocal((prev) => (prev ? { ...prev, unit } : prev));
                    onPersistItem(local.id, { unit });
                  }}
                  onBlur={onBlur}
                  placeholder={t("unitPlaceholder")}
                  className={cn(fieldInputClassName, fieldValueClassName)}
                />
              </ValueEditRow>

              <ValueEditRow icon={Coins} label={t("columnUnitPrice")}>
                <input
                  value={local.unitPrice}
                  inputMode="decimal"
                  onChange={(event) => {
                    const unitPrice = event.target.value;
                    setLocal((prev) => (prev ? { ...prev, unitPrice } : prev));
                    onPersistItem(local.id, { unitPrice });
                  }}
                  onBlur={() => {
                    const normalized = normalizeTemplateDecimalInput(local.unitPrice);
                    if (normalized !== local.unitPrice) {
                      setLocal((prev) => (prev ? { ...prev, unitPrice: normalized } : prev));
                      onPersistItem(local.id, { unitPrice: normalized });
                    }
                    void onBlur();
                  }}
                  placeholder={t("unitPricePlaceholder")}
                  className={cn(fieldInputClassName, fieldValueClassName)}
                />
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {currency}
                </span>
              </ValueEditRow>

              <ValueEditRow icon={Percent} label={tEst("editor.mobile.vatPercent")}>
                <input
                  value={local.vatRate}
                  inputMode="decimal"
                  onChange={(event) => {
                    const vatRate = event.target.value;
                    setLocal((prev) => (prev ? { ...prev, vatRate } : prev));
                    onPersistItem(local.id, { vatRate });
                  }}
                  onBlur={() => {
                    const normalized = normalizeTemplateDecimalInput(local.vatRate);
                    if (normalized !== local.vatRate) {
                      setLocal((prev) => (prev ? { ...prev, vatRate: normalized } : prev));
                      onPersistItem(local.id, { vatRate: normalized });
                    }
                    void onBlur();
                  }}
                  placeholder={t("vatRatePlaceholder")}
                  className={cn(fieldInputClassName, fieldValueClassName)}
                />
              </ValueEditRow>
            </div>
          </div>

          <SheetFooter className="flex-col gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <Button
              type="button"
              variant="outline"
              className={cn(
                estimateOutlineButtonClassName,
                "w-full border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive",
              )}
              onClick={handleDelete}
              disabled={isBusy}
            >
              <Trash2 className="size-4" />
              {isDeleteInProgress ? tEst("editor.mobile.removing") : tEst("editor.mobile.remove")}
            </Button>
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className={cn(estimateOutlineButtonClassName, "flex-1")}
                onClick={handleCancel}
                disabled={isBusy}
              >
                {tEst("editor.mobile.cancel")}
              </Button>
              <Button
                type="button"
                className={cn(estimatePrimaryButtonClassName, "flex-1")}
                onClick={handleSave}
                disabled={isBusy}
              >
                {isSaveInProgress || autosaveStatus === "saving"
                  ? tEst("editor.mobile.saving")
                  : tEst("editor.mobile.save")}
              </Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
