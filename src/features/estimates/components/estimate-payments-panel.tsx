"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { computePaymentSummary } from "@/features/estimates/lib/payment-installment-summary";
import { reorderPaymentInstallmentList } from "@/features/estimates/lib/reorder-payment-installments";
import {
  PAYMENT_SCHEDULE_PRESET_IDS,
  type PaymentSchedulePresetId,
} from "@/features/estimates/lib/payment-schedule-presets";
import type { PaymentInstallmentClient } from "@/features/estimates/lib/serialize-payment-installments";
import {
  createPaymentInstallmentAction,
  deletePaymentInstallmentAction,
  generatePaymentScheduleAction,
  markPaymentInstallmentPaidAction,
  markPaymentInstallmentUnpaidAction,
  recordPaymentInstallmentAction,
  reorderPaymentInstallmentsAction,
  updatePaymentInstallmentAction,
} from "@/features/estimates/server/payment-installments-actions";
import { formatCurrency, type Currency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

import {
  EstimatePaymentInstallmentFormDialog,
  type PaymentInstallmentFormValues,
} from "./estimate-payment-installment-form-dialog";
import { EstimatePaymentInstallmentRow } from "./estimate-payment-installment-row";
import {
  EstimatePaymentRecordDialog,
  type PaymentRecordFormValues,
} from "./estimate-payment-record-dialog";
import { EstimatePaymentInstallmentDeleteDialog } from "./estimate-payment-installment-delete-dialog";
import { EstimatePaymentScheduleReplaceDialog } from "./estimate-payment-schedule-replace-dialog";

interface EstimatePaymentsPanelProps {
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  currency: Currency;
  customerTotalGross: number;
  installments: PaymentInstallmentClient[];
  onInstallmentsChange: (installments: PaymentInstallmentClient[]) => void;
}

function SummaryMetric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "destructive" | "default";
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-sm font-semibold tabular-nums",
          highlight === "destructive" && "text-destructive",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function EstimatePaymentsPanel({
  estimateId,
  workspaceId,
  workspaceSlug,
  locale,
  currency,
  customerTotalGross,
  installments,
  onInstallmentsChange,
}: EstimatePaymentsPanelProps) {
  const router = useRouter();
  const t = useTranslations("estimates.editor.payments");

  const refreshHistory = useCallback(() => {
    router.refresh();
  }, [router]);

  const [formOpen, setFormOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<PaymentInstallmentClient | null>(
    null,
  );
  const [recordingInstallment, setRecordingInstallment] =
    useState<PaymentInstallmentClient | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [generatingPreset, setGeneratingPreset] = useState<PaymentSchedulePresetId | null>(null);
  const [pendingReplacePreset, setPendingReplacePreset] =
    useState<PaymentSchedulePresetId | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PaymentInstallmentClient | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const summary = useMemo(
    () => computePaymentSummary(customerTotalGross, installments),
    [customerTotalGross, installments],
  );

  const actionContext = useMemo(
    () => ({ estimateId, workspaceId, workspaceSlug, locale }),
    [estimateId, workspaceId, workspaceSlug, locale],
  );

  const presetNames = useMemo(
    () => ({
      fullPayment: t("presetNames.fullPayment"),
      advancePayment: t("presetNames.advancePayment"),
      finalAcceptance: t("presetNames.finalAcceptance"),
      implementation: t("presetNames.implementation"),
      stage1: t("presetNames.stage1"),
      stage2: t("presetNames.stage2"),
    }),
    [t],
  );

  const presetLabels: Record<PaymentSchedulePresetId, string> = {
    "100": t("presets.100"),
    "50-50": t("presets.50-50"),
    "30-40-30": t("presets.30-40-30"),
    "20-30-30-20": t("presets.20-30-30-20"),
  };

  const handleFormSubmit = useCallback(
    async (values: PaymentInstallmentFormValues) => {
      const amount = Number(values.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return false;
      }

      const payload = {
        ...actionContext,
        name: values.name.trim(),
        amount,
        dueDate: values.dueDate || undefined,
        note: values.note.trim() || undefined,
      };

      if (editingInstallment) {
        const result = await updatePaymentInstallmentAction({
          ...payload,
          installmentId: editingInstallment.id,
        });

        if (!result.success) return false;

        onInstallmentsChange(
          installments.map((row) =>
            row.id === editingInstallment.id ? result.data.installment : row,
          ),
        );
        refreshHistory();
        return true;
      }

      const result = await createPaymentInstallmentAction(payload);
      if (!result.success) return false;

      onInstallmentsChange([...installments, result.data.installment]);
      refreshHistory();
      return true;
    },
    [actionContext, editingInstallment, installments, onInstallmentsChange, refreshHistory],
  );

  const openDeleteDialog = useCallback(
    (installmentId: string) => {
      const installment = installments.find((row) => row.id === installmentId) ?? null;
      setDeleteTarget(installment);
    },
    [installments],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    const installmentId = deleteTarget.id;
    setPendingId(installmentId);
    const result = await deletePaymentInstallmentAction({
      ...actionContext,
      installmentId,
    });
    setPendingId(null);

    if (!result.success) {
      return;
    }

    setDeleteTarget(null);
    onInstallmentsChange(installments.filter((row) => row.id !== installmentId));
    refreshHistory();
  }, [actionContext, deleteTarget, installments, onInstallmentsChange, refreshHistory]);

  const handleMarkPaid = useCallback(
    async (installmentId: string) => {
      setPendingId(installmentId);
      const result = await markPaymentInstallmentPaidAction({
        ...actionContext,
        installmentId,
      });
      setPendingId(null);

      if (!result.success) return;

      onInstallmentsChange(
        installments.map((row) =>
          row.id === installmentId ? result.data.installment : row,
        ),
      );
      refreshHistory();
    },
    [actionContext, installments, onInstallmentsChange, refreshHistory],
  );

  const handleMarkUnpaid = useCallback(
    async (installmentId: string) => {
      setPendingId(installmentId);
      const result = await markPaymentInstallmentUnpaidAction({
        ...actionContext,
        installmentId,
      });
      setPendingId(null);

      if (!result.success) return;

      onInstallmentsChange(
        installments.map((row) =>
          row.id === installmentId ? result.data.installment : row,
        ),
      );
      refreshHistory();
    },
    [actionContext, installments, onInstallmentsChange, refreshHistory],
  );

  const runGeneratePreset = useCallback(
    async (presetId: PaymentSchedulePresetId) => {
      setGeneratingPreset(presetId);
      const result = await generatePaymentScheduleAction({
        ...actionContext,
        presetId,
        customerTotalGross,
        presetNames,
      });
      setGeneratingPreset(null);

      if (!result.success) return;

      onInstallmentsChange(result.data.installments);
      refreshHistory();
    },
    [actionContext, customerTotalGross, onInstallmentsChange, presetNames, refreshHistory],
  );

  function handlePresetClick(presetId: PaymentSchedulePresetId) {
    if (installments.length > 0) {
      setPendingReplacePreset(presetId);
      return;
    }

    void runGeneratePreset(presetId);
  }

  async function handleConfirmReplace() {
    if (!pendingReplacePreset || generatingPreset != null) return;

    const presetId = pendingReplacePreset;
    await runGeneratePreset(presetId);
    setPendingReplacePreset(null);
  }

  function clearDragState() {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function handleDragOver(index: number) {
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }

  function handleDragLeave(index: number) {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  }

  const handleReorder = useCallback(
    async (fromIndex: number, toIndex: number) => {
      const reordered = reorderPaymentInstallmentList(installments, fromIndex, toIndex);
      if (reordered === installments) {
        clearDragState();
        return;
      }

      const previous = installments;
      onInstallmentsChange(reordered);
      clearDragState();
      setIsReordering(true);

      const result = await reorderPaymentInstallmentsAction({
        ...actionContext,
        installmentIds: reordered.map((row) => row.id),
      });

      setIsReordering(false);

      if (!result.success) {
        onInstallmentsChange(previous);
        return;
      }

      onInstallmentsChange(result.data.installments);
      refreshHistory();
    },
    [actionContext, installments, onInstallmentsChange, refreshHistory],
  );

  function handleDrop(targetIndex: number) {
    if (draggedIndex !== null) {
      void handleReorder(draggedIndex, targetIndex);
    }
  }

  const dragHandlers = {
    draggedIndex,
    dragOverIndex,
    onDragStart: setDraggedIndex,
    onDragEnd: clearDragState,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  };

  function openAddForm() {
    setEditingInstallment(null);
    setFormOpen(true);
  }

  function openEditForm(installment: PaymentInstallmentClient) {
    setEditingInstallment(installment);
    setFormOpen(true);
  }

  function openRecordForm(installment: PaymentInstallmentClient) {
    setRecordingInstallment(installment);
    setRecordOpen(true);
  }

  const handleRecordSubmit = useCallback(
    async (values: PaymentRecordFormValues) => {
      if (!recordingInstallment) return false;

      const paymentAmount = Number(values.paymentAmount);
      if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
        return false;
      }

      setPendingId(recordingInstallment.id);
      const result = await recordPaymentInstallmentAction({
        ...actionContext,
        installmentId: recordingInstallment.id,
        paymentAmount,
        note: values.note.trim() || undefined,
      });
      setPendingId(null);

      if (!result.success) return false;

      onInstallmentsChange(
        installments.map((row) =>
          row.id === recordingInstallment.id ? result.data.installment : row,
        ),
      );
      refreshHistory();
      return true;
    },
    [actionContext, installments, onInstallmentsChange, recordingInstallment, refreshHistory],
  );

  const overdueAmountLabel =
    summary.overdueAmount > 0
      ? formatCurrency(summary.overdueAmount, locale, currency)
      : "-";

  return (
    <div className="px-4 py-4 space-y-6">
      <div className="max-w-3xl space-y-4">
        <h2 className="text-base font-semibold">{t("title")}</h2>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <SummaryMetric
            label={t("summary.estimateValue")}
            value={formatCurrency(customerTotalGross, locale, currency)}
          />
          <SummaryMetric
            label={t("summary.paid")}
            value={formatCurrency(summary.paid, locale, currency)}
          />
          <SummaryMetric
            label={t("summary.remaining")}
            value={formatCurrency(summary.remaining, locale, currency)}
          />
          <SummaryMetric
            label={t("summary.overdueAmount")}
            value={overdueAmountLabel}
            highlight={summary.overdueAmount > 0 ? "destructive" : "default"}
          />
        </div>

        <div className="space-y-1.5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${summary.progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("summary.progress", { percent: Math.round(summary.progressPercent) })}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Button type="button" size="sm" onClick={openAddForm}>
          {t("addInstallment")}
        </Button>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_SCHEDULE_PRESET_IDS.map((presetId) => (
            <Button
              key={presetId}
              type="button"
              size="sm"
              variant="outline"
              disabled={generatingPreset != null || customerTotalGross <= 0}
              onClick={() => handlePresetClick(presetId)}
            >
              {generatingPreset === presetId ? t("generating") : presetLabels[presetId]}
            </Button>
          ))}
        </div>
      </div>

      {installments.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">{t("empty")}</div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-9 px-1" aria-hidden />
                  <TableHead>{t("columns.name")}</TableHead>
                  <TableHead className="w-px whitespace-nowrap">{t("columns.amount")}</TableHead>
                  <TableHead className="w-px whitespace-nowrap">{t("columns.dueDate")}</TableHead>
                  <TableHead className="w-px whitespace-nowrap">{t("columns.status")}</TableHead>
                  <TableHead className="w-full min-w-[10rem]">{t("columns.note")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installments.map((installment, index) => (
                  <EstimatePaymentInstallmentRow
                    key={installment.id}
                    installment={installment}
                    index={index}
                    locale={locale}
                    currency={currency}
                    layout="table"
                    drag={dragHandlers}
                    reorderDisabled={isReordering}
                    onMarkPaid={handleMarkPaid}
                    onMarkUnpaid={handleMarkUnpaid}
                    onRecordPayment={openRecordForm}
                    onEdit={openEditForm}
                    onDelete={openDeleteDialog}
                    isPending={pendingId === installment.id}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {installments.map((installment, index) => (
              <EstimatePaymentInstallmentRow
                key={installment.id}
                installment={installment}
                index={index}
                locale={locale}
                currency={currency}
                layout="card"
                drag={dragHandlers}
                reorderDisabled={isReordering}
                onMarkPaid={handleMarkPaid}
                onMarkUnpaid={handleMarkUnpaid}
                onRecordPayment={openRecordForm}
                onEdit={openEditForm}
                onDelete={openDeleteDialog}
                isPending={pendingId === installment.id}
              />
            ))}
          </div>
        </>
      )}

      <EstimatePaymentInstallmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        installment={editingInstallment}
        onSubmit={handleFormSubmit}
      />

      <EstimatePaymentRecordDialog
        open={recordOpen}
        onOpenChange={setRecordOpen}
        installment={recordingInstallment}
        locale={locale}
        currency={currency}
        onSubmit={handleRecordSubmit}
      />

      <EstimatePaymentInstallmentDeleteDialog
        installment={deleteTarget}
        onOpenChange={(open) => {
          if (!open && pendingId == null) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={() => void handleConfirmDelete()}
        isPending={deleteTarget != null && pendingId === deleteTarget.id}
      />

      <EstimatePaymentScheduleReplaceDialog
        open={pendingReplacePreset != null}
        onOpenChange={(open) => {
          if (!open && generatingPreset == null) {
            setPendingReplacePreset(null);
          }
        }}
        presetId={pendingReplacePreset}
        presetLabel={pendingReplacePreset ? presetLabels[pendingReplacePreset] : ""}
        onConfirm={() => void handleConfirmReplace()}
        isPending={generatingPreset != null}
      />
    </div>
  );
}
