"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { PaymentsListDateRangePicker } from "./payments-list-date-range-picker";
import type { PaymentListDateRange } from "@/features/payments/lib/payment-list-filter";
import type { Locale } from "@/lib/locale";

interface PaymentsListToolbarProps {
  locale: Locale;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  dateRange: PaymentListDateRange;
  onDateRangeChange: (range: PaymentListDateRange) => void;
}

export function PaymentsListToolbar({
  locale,
  searchQuery,
  onSearchQueryChange,
  dateRange,
  onDateRangeChange,
}: PaymentsListToolbarProps) {
  const t = useTranslations("payments");

  return (
    <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder={t("list.searchPlaceholder")}
          className="h-10 w-full rounded-lg border-border/70 bg-background pl-9 shadow-xs"
        />
      </div>
      <PaymentsListDateRangePicker
        locale={locale}
        value={dateRange}
        onChange={onDateRangeChange}
      />
    </div>
  );
}
