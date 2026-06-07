"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaymentInstallmentClient } from "@/features/estimates/lib/serialize-payment-installments";

export type PaymentInstallmentFormValues = {
  name: string;
  amount: string;
  dueDate: string;
  note: string;
};

interface EstimatePaymentInstallmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installment?: PaymentInstallmentClient | null;
  onSubmit: (values: PaymentInstallmentFormValues) => Promise<boolean>;
}

function toFormValues(installment?: PaymentInstallmentClient | null): PaymentInstallmentFormValues {
  if (!installment) {
    return { name: "", amount: "", dueDate: "", note: "" };
  }

  return {
    name: installment.name,
    amount: String(installment.amount),
    dueDate: installment.dueDate ?? "",
    note: installment.note ?? "",
  };
}

export function EstimatePaymentInstallmentFormDialog({
  open,
  onOpenChange,
  installment,
  onSubmit,
}: EstimatePaymentInstallmentFormDialogProps) {
  const t = useTranslations("estimates.editor.payments");
  const isEdit = installment != null;
  const [values, setValues] = useState<PaymentInstallmentFormValues>(() => toFormValues(installment));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(toFormValues(installment));
    }
  }, [open, installment]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    const ok = await onSubmit(values);
    setIsSubmitting(false);
    if (ok) {
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("form.editTitle") : t("form.addTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="installment-name">{t("columns.name")}</Label>
            <Input
              id="installment-name"
              value={values.name}
              onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="installment-amount">{t("columns.amount")}</Label>
            <Input
              id="installment-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={values.amount}
              onChange={(e) => setValues((prev) => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="installment-due-date">{t("columns.dueDate")}</Label>
            <Input
              id="installment-due-date"
              type="date"
              value={values.dueDate}
              onChange={(e) => setValues((prev) => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="installment-note">{t("columns.note")}</Label>
            <Input
              id="installment-note"
              value={values.note}
              onChange={(e) => setValues((prev) => ({ ...prev, note: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("form.saving") : isEdit ? t("form.save") : t("form.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
