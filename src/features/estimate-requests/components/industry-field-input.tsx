"use client";

import { BriefcaseBusiness, Building2, CalendarDays, Home, Store, Wrench } from "lucide-react";

import type { IndustryFieldForDocument } from "@/features/industry-fields/server/get-fields-for-workspace";
import { getIndustryOptionLabel } from "@/features/estimate-requests/config/industry-option-labels";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type IndustryFieldValue = string | number | boolean | null;

const iconByValue = {
  apartment: Building2,
  house: Home,
  office: BriefcaseBusiness,
  commercial: Store,
  other: Wrench,
} as const;

const fieldInputClassName = "h-10 rounded-xl border-input bg-background/80 shadow-xs dark:bg-input/30";

export function IndustryFieldInput({
  field,
  value,
  onChange,
  locale,
  selectPlaceholder,
}: {
  field: IndustryFieldForDocument;
  value: IndustryFieldValue;
  onChange: (key: string, value: IndustryFieldValue) => void;
  locale: Locale;
  selectPlaceholder: string;
}) {
  if (field.valueType === "SELECT" && field.key === "property_type") {
    return (
      <div className="space-y-3">
        <FieldLabel field={field} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {(field.options ?? []).map((option) => {
            const Icon = iconByValue[option.value as keyof typeof iconByValue] ?? Building2;
            const selected = value === option.value;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(field.key, option.value)}
                className={cn(
                  "group flex min-h-20 flex-col items-center justify-center rounded-2xl border bg-background/65 p-3 text-center shadow-xs transition dark:bg-input/20",
                  "border-input hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  selected && "border-primary/45 bg-primary/10 shadow-[0_0_0_1px_rgba(59,130,246,0.22)]",
                )}
              >
                <Icon className={cn("mb-3 size-4", selected ? "text-primary" : "text-muted-foreground")} />
                <span className="block text-xs font-semibold text-foreground">
                  {getIndustryOptionLabel(field.key, option.value, locale, "label")}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.valueType === "SELECT") {
    return (
      <div className="space-y-2">
        <FieldLabel field={field} />
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(field.key, event.target.value)}
          required={field.required}
          className={cn(
            fieldInputClassName,
            "w-full appearance-none px-3 text-sm text-foreground outline-none",
            !value && "text-muted-foreground",
          )}
        >
          <option value="">{field.placeholder ?? selectPlaceholder}</option>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {getIndustryOptionLabel(field.key, option.value, locale, "label")}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.valueType === "BOOLEAN") {
    return (
      <label className="flex items-center gap-2 rounded-xl border border-input bg-background/65 p-3 text-xs font-medium text-foreground shadow-xs dark:bg-input/20">
        <Checkbox
          checked={value === true}
          onCheckedChange={(checked) => onChange(field.key, checked === true)}
        />
        {field.label}
      </label>
    );
  }

  return (
    <div className="space-y-2">
      <FieldLabel field={field} />
      <div className="relative">
        <Input
          type={field.valueType === "NUMBER" ? "number" : field.valueType === "DATE" ? "date" : "text"}
          value={typeof value === "boolean" || value === null ? "" : String(value)}
          onChange={(event) => {
            const next = event.target.value;
            onChange(field.key, field.valueType === "NUMBER" && next ? Number(next) : next);
          }}
          required={field.required}
          placeholder={field.placeholder ?? undefined}
          className={cn(fieldInputClassName, field.valueType === "NUMBER" && "pr-10")}
        />
        {field.valueType === "DATE" ? (
          <CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        ) : null}
      </div>
    </div>
  );
}

function FieldLabel({ field }: { field: IndustryFieldForDocument }) {
  return (
    <Label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
      {field.label}
      {field.required ? <span className="text-primary">*</span> : null}
    </Label>
  );
}
