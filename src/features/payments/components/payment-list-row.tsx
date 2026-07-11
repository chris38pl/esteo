"use client";

import Link from "next/link";
import { Banknote, MoreVertical, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PaymentInstallmentStatus } from "@/features/estimates/lib/payment-installment-status";
import type { PaymentListPageItem } from "@/features/payments/server/list-payments-page-data";
import { formatCurrency, type Currency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface PaymentListRowProps {
  item: PaymentListPageItem;
  workspaceSlug: string;
  locale: Locale;
  layout?: "table" | "list";
}

const iconClassName =
  "flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/10";

function StatusBadge({ status }: { status: PaymentInstallmentStatus }) {
  const t = useTranslations("payments.list.status");

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

export function PaymentListRow({
  item,
  workspaceSlug,
  locale,
  layout = "table",
}: PaymentListRowProps) {
  const t = useTranslations("payments");
  const dateLocale = locale === "pl" ? "pl-PL" : "en-US";
  const href = `/${locale}/dashboard/${workspaceSlug}/estimates/${item.estimate.id}`;

  const toCurrency = (code: string): Currency => (code === "EUR" ? "EUR" : "PLN");
  const currency = toCurrency(item.estimate.currency);

  const formatDate = (value: string | null) => {
    if (!value) {
      return t("list.noDueDate");
    }

    return new Intl.DateTimeFormat(dateLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(`${value}T12:00:00`));
  };

  const displayTitle = item.installment.name;
  const subline = formatDate(item.installment.dueDate);
  const estimateTitle = item.estimate.title ?? t("list.estimateFallback");
  const estimateSubline =
    item.estimate.requestNumber ?? item.listContext.investmentDescription ?? "-";
  const customerName = item.listContext.customerName ?? t("list.unknownClient");
  const customerSubline = item.listContext.customerLocation ?? "-";

  const titleCell = (linkTitle: boolean) => (
    <div className="flex min-w-0 items-center gap-3">
      <span className={iconClassName}>
        <Banknote className="size-4" />
      </span>
      <div className="min-w-0">
        {linkTitle ? (
          <Link
            href={href}
            className="line-clamp-2 font-semibold underline-offset-4 hover:text-primary hover:underline"
          >
            {displayTitle}
          </Link>
        ) : (
          <p className="line-clamp-2 font-semibold">{displayTitle}</p>
        )}
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{subline}</p>
      </div>
    </div>
  );

  const amountCell = (value: number, emphasize = false) => (
    <p
      className={cn(
        "tabular-nums whitespace-nowrap",
        emphasize ? "font-semibold" : "text-muted-foreground",
      )}
    >
      {formatCurrency(value, locale, currency)}
    </p>
  );

  const statusCell = <StatusBadge status={item.status} />;

  const actionsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-8 shrink-0 rounded-md"
          aria-label={t("list.actions.more")}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={href} className="gap-2">
            <Pencil className="size-4" />
            {t("list.actions.openEstimate")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (layout === "list") {
    return (
      <Link
        href={href}
        aria-label={t("list.actions.openEstimate")}
        className="flex min-w-0 flex-col gap-3 rounded-lg border border-border/60 px-4 py-4 transition-colors hover:bg-muted/30 active:bg-muted/40"
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          {titleCell(false)}
          {statusCell}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t("list.columns.client")}
            </p>
            <p className="mt-0.5 truncate font-medium">{customerName}</p>
            <p className="truncate text-xs text-muted-foreground">{customerSubline}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t("list.columns.estimate")}
            </p>
            <p className="mt-0.5 truncate font-medium">{estimateTitle}</p>
            <p className="truncate text-xs text-muted-foreground">{estimateSubline}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-xs">
          <div>
            <p className="text-muted-foreground">{t("list.columns.grossValue")}</p>
            {amountCell(item.installment.amount, true)}
          </div>
          <div>
            <p className="text-muted-foreground">{t("list.columns.received")}</p>
            {amountCell(item.installment.paidAmount)}
          </div>
          <div>
            <p className="text-muted-foreground">{t("list.columns.remaining")}</p>
            {amountCell(item.remainingAmount)}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <tr className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30">
      <td className="px-4 py-3">{titleCell(true)}</td>

      <td className="hidden px-4 py-3 md:table-cell">
        <p className="truncate font-medium">{customerName}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{customerSubline}</p>
      </td>

      <td className="hidden px-4 py-3 lg:table-cell">
        <p className="truncate font-medium">{estimateTitle}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{estimateSubline}</p>
      </td>

      <td className="hidden px-4 py-3 xl:table-cell">
        <p className="truncate font-medium tabular-nums">{formatDate(item.installment.dueDate)}</p>
      </td>

      <td className="px-4 py-3 text-right">{amountCell(item.installment.amount, true)}</td>

      <td className="hidden px-4 py-3 text-right sm:table-cell">
        {amountCell(item.installment.paidAmount)}
      </td>

      <td className="hidden px-4 py-3 text-right lg:table-cell">
        {amountCell(item.remainingAmount)}
      </td>

      <td className="px-4 py-3">{statusCell}</td>

      <td className="px-2 py-3">{actionsMenu}</td>
    </tr>
  );
}
