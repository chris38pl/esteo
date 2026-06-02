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

const fieldInputClassName =
  "h-10 rounded-lg border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:border-orange-400/70 focus-visible:ring-orange-500/20";

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
                  "group min-h-20 rounded-xl border bg-white/[0.03] p-3 text-left transition",
                  "border-white/10 hover:border-orange-400/50 hover:bg-orange-500/10",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30",
                  selected && "border-orange-400 bg-orange-500/15 shadow-[0_0_0_1px_rgba(251,146,60,0.25)]",
                )}
              >
                <Icon className="mb-3 size-4 text-orange-400" />
                <span className="block text-xs font-semibold text-white">
                  {getIndustryOptionLabel(field.key, option.value, locale, "label")}
                </span>
                <span className="mt-1 block text-[10px] leading-4 text-slate-500">
                  {getIndustryOptionLabel(field.key, option.value, locale, "description")}
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
            "w-full appearance-none px-3 text-sm outline-none",
            !value && "text-slate-500",
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
      <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs font-medium text-white">
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
          <CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        ) : null}
      </div>
    </div>
  );
}

function FieldLabel({ field }: { field: IndustryFieldForDocument }) {
  return (
    <Label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
      {field.label}
      {field.required ? <span className="text-orange-400">*</span> : null}
    </Label>
  );
}
