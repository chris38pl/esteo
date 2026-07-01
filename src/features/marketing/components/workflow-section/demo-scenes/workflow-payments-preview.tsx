"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { buildPaymentScheduleFromPreset } from "@/features/estimates/lib/payment-schedule-presets";
import { computePaymentSummary } from "@/features/estimates/lib/payment-installment-summary";
import type { PaymentInstallmentClient } from "@/features/estimates/lib/serialize-payment-installments";
import { getWorkflowDemoGrossTotal } from "@/features/marketing/components/workflow-section/demo-scenes/workflow-estimate-preview";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/i18n/formatters";

const ease = [0.22, 1, 0.36, 1] as const;

function SummaryMetric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-xs font-semibold tabular-nums",
          highlight ? "text-emerald-600" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function buildDemoInstallments(
  locale: Locale,
  grossTotal: number,
  firstPaid: boolean,
): PaymentInstallmentClient[] {
  const presetNames =
    locale === "pl"
      ? {
          advancePayment: "Zaliczka",
          implementation: "Realizacja",
          finalAcceptance: "Odbiór końcowy",
        }
      : {
          advancePayment: "Advance payment",
          implementation: "Implementation",
          finalAcceptance: "Final acceptance",
        };

  const generated = buildPaymentScheduleFromPreset("30-40-30", grossTotal);
  const nameKeys = ["advancePayment", "implementation", "finalAcceptance"] as const;

  return generated.map((row, index) => {
    const amount = row.amount;
    const isFirst = index === 0;
    const paidAmount = isFirst && firstPaid ? amount : 0;

    return {
      id: `demo-installment-${index}`,
      estimateId: "demo",
      name: presetNames[nameKeys[index]],
      amount,
      paidAmount,
      dueDate: row.dueDate.toISOString().slice(0, 10),
      paidAt: isFirst && firstPaid ? new Date().toISOString() : null,
      note: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

export function WorkflowPaymentsPreview({
  marketingLocale,
  phase,
  reducedMotion,
}: {
  marketingLocale: Locale;
  phase: number;
  reducedMotion: boolean | null;
}) {
  const t = useTranslations("estimates.editor.payments");
  const currency = "PLN" as const;
  const grossTotal = useMemo(
    () => getWorkflowDemoGrossTotal(marketingLocale),
    [marketingLocale],
  );

  const showInstallments = reducedMotion || phase >= 3;
  const highlightMarkPaid = !reducedMotion && phase === 4;
  const firstPaid = reducedMotion || phase >= 5;

  const highlightPreset = !reducedMotion && phase === 2;

  const installments = useMemo(
    () =>
      showInstallments
        ? buildDemoInstallments(marketingLocale, grossTotal, firstPaid)
        : [],
    [showInstallments, marketingLocale, grossTotal, firstPaid],
  );

  const summary = useMemo(
    () => computePaymentSummary(grossTotal, installments),
    [grossTotal, installments],
  );

  const dateFormatLocale = marketingLocale === "pl" ? "pl-PL" : "en-US";
  const formatMoney = (value: number) => formatCurrency(value, marketingLocale, currency);

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease }}
      className="flex h-full min-h-0 flex-col overflow-y-auto"
    >
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <SummaryMetric label={t("summary.estimateValue")} value={formatMoney(grossTotal)} />
          <SummaryMetric
            label={t("summary.paid")}
            value={formatMoney(summary.paid)}
            highlight={summary.paid > 0}
          />
          <SummaryMetric label={t("summary.remaining")} value={formatMoney(summary.remaining)} />
          <SummaryMetric label={t("summary.overdueAmount")} value="—" />
        </div>

        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={false}
              animate={{ width: `${summary.progressPercent}%` }}
              transition={{ duration: reducedMotion ? 0 : 0.5, ease }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {t("summary.progress", { percent: Math.round(summary.progressPercent) })}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {(["100", "50-50", "30-40-30", "20-30-30-20"] as const).map((presetId) => (
          <span
            key={presetId}
            className={cn(
              "inline-flex h-7 items-center rounded-md border px-2.5 text-[10px] font-medium transition-colors",
              presetId === "30-40-30" && highlightPreset
                ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30"
                : "border-border/60 bg-card text-muted-foreground",
              presetId === "30-40-30" && showInstallments && !highlightPreset
                ? "border-primary/40 bg-primary/5 text-primary"
                : null,
            )}
          >
            {t(`presets.${presetId}`)}
          </span>
        ))}
      </div>

      {showInstallments ? (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease }}
          className="mt-4 overflow-hidden rounded-xl border border-border/50"
        >
          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,0.8fr)] gap-2 border-b border-border/40 bg-muted/20 px-2.5 py-2 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>{t("columns.name")}</span>
            <span>{t("columns.amount")}</span>
            <span>{t("columns.dueDate")}</span>
            <span>{t("columns.status")}</span>
          </div>

          {installments.map((installment, index) => {
            const isPaid = installment.paidAmount >= installment.amount;
            const highlightMarkPaidRow = highlightMarkPaid && index === 0 && !isPaid;
            const showPaid = isPaid;

            return (
              <div
                key={installment.id}
                className={cn(
                  "grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,0.8fr)] gap-2 border-b border-border/30 px-2.5 py-2.5 text-[11px] last:border-b-0",
                  index === 0 && phase >= 5 && "bg-emerald-500/[0.04]",
                )}
              >
                <span className="font-medium text-foreground">{installment.name}</span>
                <span className="tabular-nums text-foreground">{formatMoney(installment.amount)}</span>
                <span className="text-muted-foreground">
                  {installment.dueDate
                    ? new Date(installment.dueDate).toLocaleDateString(dateFormatLocale)
                    : t("noDueDate")}
                </span>
                <div className="flex items-center gap-1.5">
                  {showPaid ? (
                    <span className="inline-flex rounded-md bg-emerald-600 px-1.5 py-0.5 text-[9px] font-medium text-white">
                      {t("status.PAID")}
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground",
                        highlightMarkPaidRow && "ring-2 ring-primary/35",
                      )}
                    >
                      {t("status.PENDING")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>
      ) : (
        <p className="mt-6 text-center text-xs text-muted-foreground">{t("empty")}</p>
      )}
    </motion.div>
  );
}
