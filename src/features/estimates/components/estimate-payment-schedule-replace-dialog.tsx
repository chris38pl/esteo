"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PaymentSchedulePresetId } from "@/features/estimates/lib/payment-schedule-presets";

interface EstimatePaymentScheduleReplaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetId: PaymentSchedulePresetId | null;
  presetLabel: string;
  onConfirm: () => void;
  isPending?: boolean;
}

export function EstimatePaymentScheduleReplaceDialog({
  open,
  onOpenChange,
  presetId,
  presetLabel,
  onConfirm,
  isPending = false,
}: EstimatePaymentScheduleReplaceDialogProps) {
  const t = useTranslations("estimates.editor.payments.replaceDialog");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {presetId
              ? t("descriptionWithPreset", { preset: presetLabel })
              : t("description")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button type="button" variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending ? t("confirming") : t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
