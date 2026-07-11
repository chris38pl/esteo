"use client";

import { GripVertical, MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  getInstallmentStatus,
  isInstallmentFullyPaid,
} from "@/features/estimates/lib/payment-installment-status";
import type { PaymentInstallmentClient } from "@/features/estimates/lib/serialize-payment-installments";
import { formatCurrency, formatDate, type Currency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface DragHandlers {
  draggedIndex: number | null;
  dragOverIndex: number | null;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  onDragOver: (index: number) => void;
  onDragLeave: (index: number) => void;
  onDrop: (index: number) => void;
}

interface EstimatePaymentInstallmentRowProps {
  installment: PaymentInstallmentClient;
  index: number;
  locale: Locale;
  currency: Currency;
  layout: "table" | "card";
  drag?: DragHandlers;
  reorderDisabled?: boolean;
  onMarkPaid: (id: string) => void;
  onMarkUnpaid: (id: string) => void;
  onRecordPayment: (installment: PaymentInstallmentClient) => void;
  onEdit: (installment: PaymentInstallmentClient) => void;
  onDelete: (id: string) => void;
  isPending?: boolean;
}

function StatusBadge({ status }: { status: ReturnType<typeof getInstallmentStatus> }) {
  const t = useTranslations("estimates.editor.payments.status");

  const variant =
    status === "PAID"
      ? "default"
      : status === "OVERDUE"
        ? "destructive"
        : status === "PARTIAL"
          ? "outline"
          : "secondary";

  return (
    <Badge
      variant={variant}
      className={cn(
        status === "PAID" && "bg-emerald-600 text-white hover:bg-emerald-600/90",
        status === "PARTIAL" &&
          "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      )}
    >
      {t(status)}
    </Badge>
  );
}

function DragHandle({
  index,
  drag,
  disabled,
}: {
  index: number;
  drag: DragHandlers;
  disabled?: boolean;
}) {
  const t = useTranslations("estimates.editor.payments");

  return (
    <button
      type="button"
      draggable={!disabled}
      disabled={disabled}
      className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={t("dragHandle")}
      onDragStart={() => drag.onDragStart(index)}
      onDragEnd={drag.onDragEnd}
    >
      <GripVertical className="size-4 shrink-0" />
    </button>
  );
}

type RowActionHandlers = Omit<
  EstimatePaymentInstallmentRowProps,
  "layout" | "locale" | "currency" | "index" | "drag" | "reorderDisabled"
>;

function RowMenu({
  installment,
  onMarkPaid,
  onMarkUnpaid,
  onRecordPayment,
  onEdit,
  onDelete,
  isPending,
}: RowActionHandlers) {
  const t = useTranslations("estimates.editor.payments");
  const statusInput = {
    amount: installment.amount,
    paidAmount: installment.paidAmount,
    dueDate: installment.dueDate,
  };
  const isFullyPaid = isInstallmentFullyPaid(statusInput);
  const hasPayment = installment.paidAmount > 0;
  const hasPaymentActions = !isFullyPaid || hasPayment;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="size-8" disabled={isPending}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">{t("actions.more")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {hasPaymentActions ? (
          <>
            {!isFullyPaid ? (
              <DropdownMenuItem onClick={() => onRecordPayment(installment)}>
                {t("actions.recordPayment")}
              </DropdownMenuItem>
            ) : null}
            {!isFullyPaid ? (
              <DropdownMenuItem onClick={() => onMarkPaid(installment.id)}>
                {t("markPaid")}
              </DropdownMenuItem>
            ) : null}
            {hasPayment ? (
              <DropdownMenuItem onClick={() => onMarkUnpaid(installment.id)}>
                {t("markUnpaid")}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem onClick={() => onEdit(installment)}>{t("actions.edit")}</DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(installment.id)}
        >
          {t("actions.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AmountDisplay({
  installment,
  locale,
  currency,
}: {
  installment: PaymentInstallmentClient;
  locale: Locale;
  currency: Currency;
}) {
  const t = useTranslations("estimates.editor.payments");
  const hasPartial =
    installment.paidAmount > 0 && installment.paidAmount < installment.amount;

  if (!hasPartial) {
    return <>{formatCurrency(installment.amount, locale, currency)}</>;
  }

  return (
    <span className="tabular-nums">
      {t("amountPartial", {
        paid: formatCurrency(installment.paidAmount, locale, currency),
        total: formatCurrency(installment.amount, locale, currency),
      })}
    </span>
  );
}

export function EstimatePaymentInstallmentRow({
  installment,
  index,
  locale,
  currency,
  layout,
  drag,
  reorderDisabled = false,
  onMarkPaid,
  onMarkUnpaid,
  onRecordPayment,
  onEdit,
  onDelete,
  isPending = false,
}: EstimatePaymentInstallmentRowProps) {
  const t = useTranslations("estimates.editor.payments");
  const status = getInstallmentStatus({
    amount: installment.amount,
    paidAmount: installment.paidAmount,
    dueDate: installment.dueDate,
  });
  const dueDateLabel = installment.dueDate
    ? formatDate(installment.dueDate, locale)
    : t("noDueDate");

  const dragRowClass = cn(
    drag?.draggedIndex === index && "opacity-50",
    drag?.dragOverIndex === index && "bg-muted/40",
  );

  const dragRowProps = drag
    ? {
        onDragOver: (event: React.DragEvent) => {
          event.preventDefault();
          drag.onDragOver(index);
        },
        onDragLeave: () => drag.onDragLeave(index),
        onDrop: (event: React.DragEvent) => {
          event.preventDefault();
          drag.onDrop(index);
        },
      }
    : {};

  const rowActionProps = {
    installment,
    onMarkPaid,
    onMarkUnpaid,
    onRecordPayment,
    onEdit,
    onDelete,
    isPending,
  };

  if (layout === "card") {
    return (
      <div
        className={cn(
          "rounded-lg border border-border/60 bg-card p-4 space-y-3 transition-colors",
          dragRowClass,
        )}
        {...dragRowProps}
      >
        <div className="flex items-start gap-2">
          {drag ? <DragHandle index={index} drag={drag} disabled={reorderDisabled || isPending} /> : null}
          <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="font-medium text-sm">{installment.name}</p>
              <p className="text-sm text-muted-foreground">
                <AmountDisplay installment={installment} locale={locale} currency={currency} />
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusBadge status={status} />
              <RowMenu {...rowActionProps} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>
            <p className="font-medium text-foreground/80">{t("columns.dueDate")}</p>
            <p>{dueDateLabel}</p>
          </div>
          {installment.note ? (
            <div className="col-span-2">
              <p className="font-medium text-foreground/80">{t("columns.note")}</p>
              <p className="text-foreground whitespace-pre-wrap">{installment.note}</p>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <TableRow className={dragRowClass} {...dragRowProps}>
      {drag ? (
        <TableCell className="w-9 px-1">
          <DragHandle index={index} drag={drag} disabled={reorderDisabled || isPending} />
        </TableCell>
      ) : null}
      <TableCell className="min-w-[6rem] max-w-[1px] font-medium">
        <span className="block truncate" title={installment.name}>
          {installment.name}
        </span>
      </TableCell>
      <TableCell className="w-px whitespace-nowrap tabular-nums">
        <AmountDisplay installment={installment} locale={locale} currency={currency} />
      </TableCell>
      <TableCell className="w-px whitespace-nowrap text-muted-foreground">{dueDateLabel}</TableCell>
      <TableCell className="w-px whitespace-nowrap">
        <StatusBadge status={status} />
      </TableCell>
      <TableCell className="w-full min-w-[10rem]">
        <div className="flex min-w-0 items-center gap-1">
          <span
            className="min-w-0 flex-1 truncate text-muted-foreground"
            title={installment.note ?? undefined}
          >
            {installment.note ?? "-"}
          </span>
          <div className="shrink-0">
            <RowMenu {...rowActionProps} />
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
