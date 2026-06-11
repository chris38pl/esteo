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
import {
  estimateOutlineButtonClassName,
  estimatePrimaryButtonClassName,
} from "@/features/estimates/components/estimate-action-button-styles";
import { useEstimateMobileLayout } from "@/features/estimates/hooks/use-estimate-mobile-layout";
import {
  EMPTY_REQUEST_LIST_DATE_RANGE,
  type RequestListDateField,
  type RequestListDateRange,
} from "@/features/estimate-requests/lib/requests-list-filter";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface RequestsListDateRangePickerProps {
  locale: Locale;
  value: RequestListDateRange;
  onChange: (range: RequestListDateRange) => void;
}

const DATE_FIELDS: RequestListDateField[] = ["received", "updated"];

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

function toDateRange(value: RequestListDateRange): DateRange | undefined {
  if (!value.from && !value.to) {
    return undefined;
  }
  return {
    from: value.from ?? undefined,
    to: value.to ?? undefined,
  };
}

function fromDateRange(field: RequestListDateField, range: DateRange | undefined): RequestListDateRange {
  return {
    field,
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

export function RequestsListDateRangePicker({
  locale,
  value,
  onChange,
}: RequestsListDateRangePickerProps) {
  const t = useTranslations("requests");
  const isMobile = useEstimateMobileLayout();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RequestListDateRange>(value);

  useEffect(() => {
    if (open) {
      setDraft(value);
    }
  }, [open, value]);

  const active = value.from !== null || value.to !== null;

  const triggerLabel = useMemo(() => {
    if (!active) {
      return t("list.toolbar.dateRange");
    }
    const fromLabel = value.from ? formatCompactDate(value.from, locale) : "…";
    const toLabel = value.to ? formatCompactDate(value.to, locale) : "…";
    return `${fromLabel} – ${toLabel}`;
  }, [active, locale, t, value.from, value.to]);

  const applyDraft = () => {
    onChange(draft);
    setOpen(false);
  };

  const clearDraft = () => {
    setDraft(EMPTY_REQUEST_LIST_DATE_RANGE);
    onChange(EMPTY_REQUEST_LIST_DATE_RANGE);
    setOpen(false);
  };

  const applyPreset = (from: Date, to: Date) => {
    setDraft({
      field: draft.field,
      from: startOfDay(from),
      to: endOfDay(to),
    });
  };

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
      <Popover open={open} onOpenChange={setOpen}>
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
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {t("list.dateRange.fieldLabel")}
              </p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {DATE_FIELDS.map((field) => {
                  const selected = draft.field === field;
                  return (
                    <button
                      key={field}
                      type="button"
                      className={cn(
                        "rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors",
                        selected
                          ? "border-primary/40 bg-primary/8 text-foreground"
                          : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground",
                      )}
                      onClick={() => setDraft((prev) => ({ ...prev, field }))}
                    >
                      {t(`list.dateRange.fields.${field}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                  onClick={() => applyPreset(preset.from, preset.to)}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <Calendar
              mode="range"
              numberOfMonths={isMobile ? 1 : 2}
              selected={toDateRange(draft)}
              onSelect={(range) => setDraft(fromDateRange(draft.field, range))}
              defaultMonth={draft.from ?? draft.to ?? today}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-border/60 p-4">
            <Button
              type="button"
              variant="outline"
              className={estimateOutlineButtonClassName}
              onClick={clearDraft}
            >
              {t("list.dateRange.clear")}
            </Button>
            <Button type="button" className={estimatePrimaryButtonClassName} onClick={applyDraft}>
              {t("list.dateRange.apply")}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {active ? (
        <button
          type="button"
          className="absolute -right-0.5 -bottom-0.5 z-10 flex size-3.5 cursor-pointer items-center justify-center rounded-full border border-primary bg-primary-foreground text-primary shadow-sm transition-colors hover:bg-primary-foreground/90 dark:border-primary-foreground dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
          aria-label={t("list.dateRange.clear")}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onChange(EMPTY_REQUEST_LIST_DATE_RANGE);
          }}
        >
          <X className="size-2.5" strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  );
}
