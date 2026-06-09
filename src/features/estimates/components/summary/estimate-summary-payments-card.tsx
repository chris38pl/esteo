"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { CalendarClock } from "lucide-react";

import { computePaymentSummary } from "@/features/estimates/lib/payment-installment-summary";
import type { PaymentInstallmentClient } from "@/features/estimates/lib/serialize-payment-installments";
import { formatCurrency, type Currency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

import { EstimateSummaryCardShell } from "./estimate-summary-card-shell";
import { EstimateSummarySectionHeader } from "./estimate-summary-section-header";

interface EstimateSummaryPaymentsCardProps {
  locale: Locale;
  currency: Currency;
  customerTotalGross: number;
  installments: PaymentInstallmentClient[];
}

function PaymentMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "paid" | "overdue" | "default";
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-sm font-semibold tabular-nums",
          tone === "paid" && "text-emerald-600 dark:text-emerald-400",
          tone === "overdue" && "text-destructive",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function EstimateSummaryPaymentsCard({
  locale,
  currency,
  customerTotalGross,
  installments,
}: EstimateSummaryPaymentsCardProps) {
  const t = useTranslations("estimates");

  const summary = useMemo(
    () => computePaymentSummary(customerTotalGross, installments),
    [customerTotalGross, installments],
  );

  const overdueLabel =
    summary.overdueAmount > 0
      ? formatCurrency(summary.overdueAmount, locale, currency)
      : formatCurrency(0, locale, currency);

  return (
    <EstimateSummaryCardShell>
      <EstimateSummarySectionHeader
        icon={CalendarClock}
        title={t("editor.summary.payments.title")}
      />

      <div className="grid grid-cols-3 gap-4 border-t border-border/60 px-5 py-4">
        <PaymentMetric
          label={t("editor.summary.payments.paid")}
          value={formatCurrency(summary.paid, locale, currency)}
          tone="paid"
        />
        <PaymentMetric
          label={t("editor.summary.payments.remaining")}
          value={formatCurrency(summary.remaining, locale, currency)}
        />
        <PaymentMetric
          label={t("editor.summary.payments.overdue")}
          value={overdueLabel}
          tone={summary.overdueAmount > 0 ? "overdue" : "default"}
        />
      </div>
    </EstimateSummaryCardShell>
  );
}
