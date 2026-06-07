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
import { getInstallmentRemainingAmount } from "@/features/estimates/lib/payment-installment-status";
import type { PaymentInstallmentClient } from "@/features/estimates/lib/serialize-payment-installments";
import { formatCurrency, type Currency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";

export type PaymentRecordFormValues = {
  paymentAmount: string;
  note: string;
};

interface EstimatePaymentRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installment: PaymentInstallmentClient | null;
  locale: Locale;
  currency: Currency;
  onSubmit: (values: PaymentRecordFormValues) => Promise<boolean>;
}

export function EstimatePaymentRecordDialog({
  open,
  onOpenChange,
  installment,
  locale,
  currency,
  onSubmit,
}: EstimatePaymentRecordDialogProps) {
  const t = useTranslations("estimates.editor.payments.recordPayment");
  const [values, setValues] = useState<PaymentRecordFormValues>({ paymentAmount: "", note: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remaining = installment
    ? getInstallmentRemainingAmount({
        amount: installment.amount,
        paidAmount: installment.paidAmount,
        dueDate: installment.dueDate,
      })
    : 0;

  useEffect(() => {
    if (open && installment) {
      setValues({
        paymentAmount: String(remaining),
        note: "",
      });
    }
  }, [open, installment, remaining]);

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
          <DialogTitle>{t("title")}</DialogTitle>
          {installment ? (
            <p className="text-sm text-muted-foreground">
              {t("subtitle", {
                name: installment.name,
                remaining: formatCurrency(remaining, locale, currency),
              })}
            </p>
          ) : null}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-amount">{t("amountLabel")}</Label>
            <Input
              id="payment-amount"
              type="number"
              min="0.01"
              max={remaining}
              step="0.01"
              value={values.paymentAmount}
              onChange={(e) => setValues((prev) => ({ ...prev, paymentAmount: e.target.value }))}
              required
            />
            {installment && installment.paidAmount > 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("alreadyPaid", {
                  paid: formatCurrency(installment.paidAmount, locale, currency),
                  total: formatCurrency(installment.amount, locale, currency),
                })}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-note">{t("noteLabel")}</Label>
            <Input
              id="payment-note"
              value={values.note}
              onChange={(e) => setValues((prev) => ({ ...prev, note: e.target.value }))}
              placeholder={t("notePlaceholder")}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("saving") : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
