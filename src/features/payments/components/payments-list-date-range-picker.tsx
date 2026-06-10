"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { estimateOutlineButtonClassName, estimatePrimaryButtonClassName } from "@/features/estimates/components/estimate-action-button-styles";
import {
  EMPTY_PAYMENT_LIST_DATE_RANGE,
  type PaymentListDateRange,
} from "@/features/payments/lib/payment-list-filter";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface PaymentsListDateRangePickerProps {
  locale: Locale;
  value: PaymentListDateRange;
  onChange: (range: PaymentListDateRange) => void;
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function subDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return startOfDay(result);
}

function toDateRange(value: PaymentListDateRange): DateRange | undefined {
  if (!value.from && !value.to) {
    return undefined;
  }

  return {
    from: value.from ?? undefined,
    to: value.to ?? undefined,
  };
}

function fromDateRange(range: DateRange | undefined): PaymentListDateRange {
  return {
    from: range?.from ? startOfDay(range.from) : null,
    to: range?.to ? endOfDay(range.to) : null,
  };
}

function formatCompactDate(date: Date, locale: Locale): string {
  const dateLocale = locale === "pl" ? "pl-PL" : "en-US";
  return new Intl.DateTimeFormat(dateLocale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function PaymentsListDateRangePicker({
  locale,
  value,
  onChange,
}: PaymentsListDateRangePickerProps) {
  const t = useTranslations("payments");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PaymentListDateRange>(value);

  useEffect(() => {
    if (!open) {
      setDraft(value);
    }
  }, [open, value]);

  const active = value.from !== null || value.to !== null;

  const label = useMemo(() => {
    if (!active) {
      return t("list.dateRange.placeholder");
    }

    if (value.from && value.to) {
      return t("list.dateRange.range", {
        from: formatCompactDate(value.from, locale),
        to: formatCompactDate(value.to, locale),
      });
    }

    if (value.from) {
      return t("list.dateRange.fromOnly", {
        from: formatCompactDate(value.from, locale),
      });
    }

    return t("list.dateRange.toOnly", {
      to: formatCompactDate(value.to!, locale),
    });
  }, [active, locale, t, value.from, value.to]);

  const presets = useMemo(() => {
    const today = startOfDay(new Date());
    return [
      {
        key: "last30",
        label: t("list.dateRange.presets.last30"),
        range: { from: subDays(today, 29), to: endOfDay(today) },
      },
      {
        key: "thisMonth",
        label: t("list.dateRange.presets.thisMonth"),
        range: {
          from: startOfDay(new Date(today.getFullYear(), today.getMonth(), 1)),
          to: endOfDay(today),
        },
      },
      {
        key: "next30",
        label: t("list.dateRange.presets.next30"),
        range: {
          from: today,
          to: endOfDay(subDays(today, -29)),
        },
      },
    ] as const;
  }, [t]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={active ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-9 max-w-full shrink-0 gap-2 rounded-md shadow-xs max-sm:px-2",
            !active && estimateOutlineButtonClassName,
            active &&
              "border-primary bg-primary text-primary-foreground hover:bg-primary/90 dark:border-primary dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 [&_svg]:text-primary-foreground",
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          <span className="truncate text-xs sm:text-sm">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <PopoverHeader className="border-b border-border/60 px-4 py-3">
          <PopoverTitle>{t("list.dateRange.title")}</PopoverTitle>
        </PopoverHeader>
        <div className="flex flex-col gap-3 p-3 sm:flex-row">
          <div className="flex flex-col gap-2 sm:min-w-[9rem]">
            {presets.map((preset) => (
              <Button
                key={preset.key}
                type="button"
                variant="outline"
                size="sm"
                className={estimateOutlineButtonClassName}
                onClick={() => setDraft(preset.range)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            selected={toDateRange(draft)}
            onSelect={(range) => setDraft(fromDateRange(range))}
            numberOfMonths={1}
          />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => {
              onChange(EMPTY_PAYMENT_LIST_DATE_RANGE);
              setOpen(false);
            }}
          >
            <X className="size-4" />
            {t("list.dateRange.clear")}
          </Button>
          <Button
            type="button"
            size="sm"
            className={estimatePrimaryButtonClassName}
            onClick={() => {
              onChange(draft);
              setOpen(false);
            }}
          >
            {t("list.dateRange.apply")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
