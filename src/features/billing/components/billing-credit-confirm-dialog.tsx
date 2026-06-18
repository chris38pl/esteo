"use client";

import type { BillingChangePreview } from "@/features/billing/billing-page-data";
import { formatBillingMonthlyPrice, formatSignedBillingAmount } from "@/features/billing/lib/format-billing-amount";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/locale";
import { useTranslations } from "next-intl";

type Props = {
  open: boolean;
  preview: BillingChangePreview | null;
  locale: Locale;
  pending: boolean;
  expired: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onRecalculate: () => void;
};

export function BillingCreditConfirmDialog({
  open,
  preview,
  locale,
  pending,
  expired,
  onOpenChange,
  onConfirm,
  onRecalculate,
}: Props) {
  const t = useTranslations("billing.workspace.preview");

  if (!preview) {
    return null;
  }

  const creditCents = Math.abs(preview.invoiceDeltaCents);
  const currency = preview.currency;
  const monthlyAmount = formatBillingMonthlyPrice(preview.recurringCents, locale, currency);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("creditTitle")}</DialogTitle>
          <DialogDescription>
            {expired
              ? t("expired")
              : t("creditConfirm", {
                  amount: formatSignedBillingAmount(-creditCents, locale, currency),
                  monthlyAmount,
                })}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {t("cancel")}
          </Button>
          {expired ? (
            <Button type="button" onClick={onRecalculate}>
              {t("recalculate")}
            </Button>
          ) : (
            <Button type="button" onClick={onConfirm} disabled={pending}>
              {t("confirm")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
