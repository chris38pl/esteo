"use client";

import type { BillingChangePreview } from "@/features/billing/billing-page-data";
import { BillingInvoiceAdjustmentRow } from "@/features/billing/components/billing-invoice-adjustment-row";
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

export function BillingChangePreviewDialog({
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

  const currency = preview.currency;
  const monthlyAmount = formatBillingMonthlyPrice(preview.recurringCents, locale, currency);
  const prorationCents = preview.prorationCents;
  const hasCharge = prorationCents > 1;
  const hasCredit = prorationCents < -1;
  const referralBalanceAppliedCents = preview.referralBalanceAppliedCents ?? 0;
  const hasReferralBalance = referralBalanceAppliedCents > 0;
  const showBreakdown = hasCharge || hasCredit || hasReferralBalance;
  const referralBalanceTooltip = t("referralBalanceCreditTooltip");

  const adjustmentTooltip = t("adjustmentTooltip", { monthlyAmount });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {expired ? (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">{t("expired")}</p>
            <Button type="button" variant="outline" onClick={onRecalculate}>
              {t("recalculate")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">{t("newMonthlyCost")}</p>
              <p className="text-2xl font-semibold tracking-tight">{monthlyAmount}</p>
            </div>

            <div className="space-y-3 border-t border-border/50 pt-4">
              <div className="space-y-1">
                <p className="text-muted-foreground">{t("nextInvoice")}</p>
                <p className="text-2xl font-semibold tracking-tight">
                  {formatBillingMonthlyPrice(preview.nextInvoiceCents, locale, currency)}
                </p>
              </div>

              {showBreakdown ? (
                <div className="space-y-3">
                  <p className="font-medium text-foreground">{t("breakdown.composedOf")}</p>

                  <dl className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-muted-foreground">{t("breakdown.subscription")}</dt>
                      <dd className="font-medium">{monthlyAmount}</dd>
                    </div>

                    {hasCharge ? (
                      <BillingInvoiceAdjustmentRow
                        label={t("adjustmentCharge")}
                        amount={formatSignedBillingAmount(prorationCents, locale, currency)}
                        badge={{ label: t("badge.oneTimeCharge"), variant: "amber" }}
                        tooltip={adjustmentTooltip}
                      />
                    ) : null}

                    {hasCredit ? (
                      <BillingInvoiceAdjustmentRow
                        label={t("adjustmentCredit")}
                        amount={formatSignedBillingAmount(prorationCents, locale, currency)}
                        badge={{ label: t("badge.credit"), variant: "green" }}
                        tooltip={adjustmentTooltip}
                      />
                    ) : null}

                    {hasReferralBalance ? (
                      <BillingInvoiceAdjustmentRow
                        label={t("breakdown.referralBalanceCredit")}
                        amount={`-${formatBillingMonthlyPrice(
                          referralBalanceAppliedCents,
                          locale,
                          currency,
                        )}`}
                        tooltip={referralBalanceTooltip}
                      />
                    ) : null}
                  </dl>

                  {hasCharge ? (
                    <div className="space-y-1 text-muted-foreground">
                      <p>{t("chargeOnlyOnce")}</p>
                      <p>{t("chargeNotRecurring")}</p>
                    </div>
                  ) : hasCredit ? (
                    <p className="text-muted-foreground">{t("hintOneTimeCredit")}</p>
                  ) : null}

                  {hasReferralBalance && hasCharge ? (
                    <p className="text-sm text-muted-foreground">{t("referralBalanceAddonsNote")}</p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="space-y-1 border-t border-border/50 pt-4 text-muted-foreground">
              <p>
                <span>{t("upcomingInvoices")}: </span>
                <span className="font-medium text-foreground">
                  {t("recurringMonthlyValue", { amount: monthlyAmount })}
                </span>
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {t("cancel")}
          </Button>
          {!expired ? (
            <Button type="button" onClick={onConfirm} disabled={pending}>
              {t("confirm")}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
