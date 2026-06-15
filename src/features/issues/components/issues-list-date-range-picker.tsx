"use client";

import { useMemo, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
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
import {
  estimateOutlineButtonClassName,
  estimatePrimaryButtonClassName,
} from "@/features/estimates/components/estimate-action-button-styles";
import { useEstimateMobileLayout } from "@/features/estimates/hooks/use-estimate-mobile-layout";
import {
  EMPTY_ISSUES_LIST_DATE_RANGE,
  type IssuesListDateRange,
} from "@/features/issues/lib/issues-list-filter";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

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

function startOfMonth(date: Date): Date {
  return startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
}

function toDateRange(value: IssuesListDateRange): DateRange | undefined {
  if (!value.from && !value.to) {
    return undefined;
  }

  return {
    from: value.from ?? undefined,
    to: value.to ?? undefined,
  };
}

function fromDateRange(range: DateRange | undefined): IssuesListDateRange {
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

export function IssuesListDateRangePicker({
  locale,
  value,
  onChange,
}: {
  locale: Locale;
  value: IssuesListDateRange;
  onChange: (range: IssuesListDateRange) => void;
}) {
  const t = useTranslations("issues");
  const isMobile = useEstimateMobileLayout();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<IssuesListDateRange>(value);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraft(value);
    }
    setOpen(nextOpen);
  }

  const active = value.from !== null || value.to !== null;

  const triggerLabel = useMemo(() => {
    if (!active) {
      return t("list.toolbar.dateRange");
    }

    const fromLabel = value.from ? formatCompactDate(value.from, locale) : "…";
    const toLabel = value.to ? formatCompactDate(value.to, locale) : "…";
    return `${fromLabel} – ${toLabel}`;
  }, [active, locale, t, value.from, value.to]);

  const today = startOfDay(new Date());

  const presets = [
    {
      id: "last7",
      label: t("list.dateRange.presets.last7"),
      from: subDays(today, 6),
      to: today,
    },
    {
      id: "last30",
      label: t("list.dateRange.presets.last30"),
      from: subDays(today, 29),
      to: today,
    },
    {
      id: "lastMonth",
      label: t("list.dateRange.presets.thisMonth"),
      from: startOfMonth(today),
      to: today,
    },
  ] as const;

  return (
    <div className="relative shrink-0">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant={active ? "default" : "outline"}
            size="icon"
            className={cn(
              "size-9 shrink-0 rounded-md px-0 shadow-xs max-sm:min-w-9 sm:h-8 sm:min-h-9 sm:w-auto sm:min-w-[7.25rem] sm:px-3",
              !active && estimateOutlineButtonClassName,
              active &&
                "border-primary bg-primary text-primary-foreground hover:bg-primary/90 dark:border-primary dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 [&_svg]:text-primary-foreground",
            )}
            aria-label={active ? triggerLabel : t("list.dateRange.triggerAria")}
          >
            <CalendarIcon className="size-4" />
            <span className="hidden max-w-[14rem] truncate sm:inline">{triggerLabel}</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          className="w-auto max-w-[calc(100vw-2rem)] p-0"
          sideOffset={8}
        >
          <PopoverHeader className="gap-0 border-b border-border/60 px-4 py-3">
            <PopoverTitle className="text-sm font-semibold">{t("list.dateRange.title")}</PopoverTitle>
          </PopoverHeader>

          <div className="space-y-4 p-4">
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={estimateOutlineButtonClassName}
                  onClick={() =>
                    setDraft({
                      from: startOfDay(preset.from),
                      to: endOfDay(preset.to),
                    })
                  }
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            <Calendar
              mode="range"
              numberOfMonths={isMobile ? 1 : 2}
              selected={toDateRange(draft)}
              onSelect={(range) => setDraft(fromDateRange(range))}
              defaultMonth={draft.from ?? today}
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border/60 px-4 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={estimateOutlineButtonClassName}
              onClick={() => {
                setDraft(EMPTY_ISSUES_LIST_DATE_RANGE);
                onChange(EMPTY_ISSUES_LIST_DATE_RANGE);
                setOpen(false);
              }}
            >
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
    </div>
  );
}
