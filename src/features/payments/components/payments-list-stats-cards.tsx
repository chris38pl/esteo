"use client";

import { AlertCircle, Banknote, CircleDollarSign, Clock, Receipt } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { isInstallmentOverdue } from "@/features/estimates/lib/payment-installment-status";
import type { PaymentListPageItem } from "@/features/payments/server/list-payments-page-data";
import { formatCurrency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface PaymentsListStatsCardsProps {
  payments: PaymentListPageItem[];
  locale: Locale;
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconClassName,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  iconClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn("surface-card flex min-w-0 items-center gap-4 p-5", className)}>
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1",
          iconClassName,
        )}
      >
        <Icon className="size-5" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-2xl font-semibold tracking-tight tabular-nums text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

export function PaymentsListStatsCards({ payments, locale }: PaymentsListStatsCardsProps) {
  const t = useTranslations("payments");

  const stats = useMemo(() => {
    let totalGross = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let overdueAmount = 0;

    for (const item of payments) {
      totalGross += item.installment.amount;
      totalPaid += item.installment.paidAmount;
      totalRemaining += item.remainingAmount;

      if (
        isInstallmentOverdue({
          amount: item.installment.amount,
          paidAmount: item.installment.paidAmount,
          dueDate: item.installment.dueDate,
        })
      ) {
        overdueAmount += item.remainingAmount;
      }
    }

    return {
      totalGross: formatCurrency(totalGross, locale, "PLN"),
      totalPaid: formatCurrency(totalPaid, locale, "PLN"),
      totalRemaining: formatCurrency(totalRemaining, locale, "PLN"),
      overdueAmount: formatCurrency(overdueAmount, locale, "PLN"),
      count: String(payments.length),
    };
  }, [payments, locale]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      <StatCard
        icon={CircleDollarSign}
        label={t("list.stats.totalGross")}
        value={stats.totalGross}
        iconClassName="bg-blue-500/10 text-blue-600 ring-blue-500/15 dark:text-blue-400"
      />
      <StatCard
        icon={Banknote}
        label={t("list.stats.received")}
        value={stats.totalPaid}
        iconClassName="bg-emerald-500/10 text-emerald-600 ring-emerald-500/15 dark:text-emerald-400"
      />
      <StatCard
        icon={Clock}
        label={t("list.stats.remaining")}
        value={stats.totalRemaining}
        iconClassName="bg-amber-500/10 text-amber-600 ring-amber-500/15 dark:text-amber-400"
      />
      <StatCard
        icon={AlertCircle}
        label={t("list.stats.overdue")}
        value={stats.overdueAmount}
        iconClassName="bg-red-500/10 text-red-600 ring-red-500/15 dark:text-red-400"
      />
      <StatCard
        icon={Receipt}
        label={t("list.stats.count")}
        value={stats.count}
        iconClassName="bg-violet-500/10 text-violet-600 ring-violet-500/15 dark:text-violet-400"
        className="sm:col-span-2 lg:col-span-1"
      />
    </div>
  );
}
