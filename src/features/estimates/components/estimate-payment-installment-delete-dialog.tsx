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
import type { PaymentInstallmentClient } from "@/features/estimates/lib/serialize-payment-installments";

interface EstimatePaymentInstallmentDeleteDialogProps {
  installment: PaymentInstallmentClient | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
}

export function EstimatePaymentInstallmentDeleteDialog({
  installment,
  onOpenChange,
  onConfirm,
  isPending = false,
}: EstimatePaymentInstallmentDeleteDialogProps) {
  const t = useTranslations("estimates.editor.payments.deleteDialog");

  return (
    <Dialog open={installment != null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>
            {installment
              ? t("titleWithName", { name: installment.name })
              : t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
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
          <Button
            type="button"
            variant="destructive"
            disabled={!installment || isPending}
            onClick={onConfirm}
          >
            {isPending ? t("deleting") : t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
