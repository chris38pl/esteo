"use client";

import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChefHat,
  Home,
  Lamp,
  ShowerHead,
  Store,
  Sun,
  Wrench,
} from "lucide-react";

import type { IndustryFieldForDocument } from "@/features/industry-fields/server/get-fields-for-workspace";
import {
  parseFieldSelectConfig,
  parseMultiSelectStoredValue,
  serializeMultiSelectValue,
} from "@/features/industry-fields/lib/field-select-config";
import { getIndustryOptionLabel } from "@/features/estimate-requests/config/industry-option-labels";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { DecimalFieldInput } from "@/components/ui/decimal-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type IndustryFieldValue = string | number | boolean | null;

const iconByValue = {
  apartment: Building2,
  house: Home,
  office: BriefcaseBusiness,
  commercial: Store,
  industrial: Building2,
  other: Wrench,
  kitchen: ChefHat,
  wardrobe: Home,
  closet: Home,
  bathroom: ShowerHead,
  reception: BriefcaseBusiness,
  new_build: Home,
  extension: Building2,
  front_replacement: Wrench,
  renovation: Wrench,
  service: Wrench,
  economy: Wrench,
  standard: BriefcaseBusiness,
  premium: Lamp,
  luxury: Lamp,
  new_installation: Home,
  photovoltaic: Sun,
  smart_home: Lamp,
  measurements: Wrench,
} as const;

const fieldInputClassName = "h-10 rounded-xl border-input bg-background/80 shadow-xs dark:bg-input/30";

export function IndustryFieldInput({
  field,
  value,
  onChange,
  locale,
  selectPlaceholder,
  disabled = false,
}: {
  field: IndustryFieldForDocument;
  value: IndustryFieldValue;
  onChange: (key: string, value: IndustryFieldValue) => void;
  locale: Locale;
  selectPlaceholder: string;
  disabled?: boolean;
}) {
  const selectConfig = parseFieldSelectConfig(field.options, field.key);

  if (selectConfig.tiles && selectConfig.choices.length > 0) {
    const selectedValues = parseMultiSelectStoredValue(value);
    const isMulti = selectConfig.selectMode === "multi";

    return (
      <div className="space-y-3">
        <FieldLabel field={field} />
        <div
          className={cn(
            "grid gap-2",
            selectConfig.choices.length > 4
              ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-2 sm:grid-cols-3",
          )}
        >
          {selectConfig.choices.map((option) => {
            const Icon = iconByValue[option.value as keyof typeof iconByValue] ?? Building2;
            const selected = selectedValues.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                onClick={() => {
                  if (isMulti) {
                    const next = selected
                      ? selectedValues.filter((item) => item !== option.value)
                      : [...selectedValues, option.value];
                    onChange(field.key, serializeMultiSelectValue(next));
                    return;
                  }
                  onChange(field.key, option.value);
                }}
                className={cn(
                  "group flex min-h-20 flex-col items-center justify-center rounded-2xl border bg-background/65 p-3 text-center shadow-xs transition dark:bg-input/20",
                  !disabled && "cursor-pointer",
                  "border-input hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  selected &&
                    "border-primary/45 bg-primary/20 dark:bg-primary/10 shadow-[0_0_0_1px_rgba(59,130,246,0.22)]",
                )}
              >
                <Icon
                  className={cn(
                    "mb-3 size-4",
                    selected ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className="block text-xs text-foreground">
                  {getIndustryOptionLabel(field.key, option.value, locale, "label")}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (selectConfig.choices.length > 0 && !selectConfig.tiles) {
    const selectedValues = parseMultiSelectStoredValue(value);
    const selected =
      selectConfig.selectMode === "multi"
        ? selectedValues
        : (selectedValues[0] ?? "");

    if (selectConfig.selectMode === "multi") {
      return (
        <div className="space-y-2">
          <FieldLabel field={field} />
          <select
            multiple
            value={selectedValues}
            onChange={(event) => {
              const next = Array.from(event.target.selectedOptions).map((option) => option.value);
              onChange(field.key, serializeMultiSelectValue(next));
            }}
            required={field.required}
            disabled={disabled}
            className={cn(
              fieldInputClassName,
              "min-h-24 w-full appearance-none px-3 py-2 text-sm text-foreground outline-none",
            )}
          >
            {selectConfig.choices.map((option) => (
              <option key={option.value} value={option.value}>
                {getIndustryOptionLabel(field.key, option.value, locale, "label")}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <FieldLabel field={field} />
        <select
          value={typeof selected === "string" ? selected : ""}
          onChange={(event) => {
            const next = event.target.value;
            onChange(
              field.key,
              field.valueType === "SELECT"
                ? next
                : serializeMultiSelectValue(next ? [next] : []),
            );
          }}
          required={field.required}
          disabled={disabled}
          className={cn(
            fieldInputClassName,
            "w-full appearance-none px-3 text-sm outline-none",
            !selected && "text-muted-foreground",
            selected && "text-foreground",
          )}
        >
          <option value="">{field.placeholder ?? selectPlaceholder}</option>
          {selectConfig.choices.map((option) => (
            <option key={option.value} value={option.value}>
              {getIndustryOptionLabel(field.key, option.value, locale, "label")}
            </option>
          ))}
        </select>
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
          disabled={disabled}
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
          disabled={disabled}
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
        {field.valueType === "NUMBER" ? (
          <DecimalFieldInput
            value={typeof value === "boolean" || value === null ? "" : value}
            onChange={(next) => onChange(field.key, next)}
            required={field.required}
            disabled={disabled}
            placeholder={field.placeholder ?? undefined}
            min={0}
            className={cn(fieldInputClassName, "pr-10")}
          />
        ) : (
          <Input
            type={field.valueType === "DATE" ? "date" : "text"}
            value={typeof value === "boolean" || value === null ? "" : String(value)}
            onChange={(event) => onChange(field.key, event.target.value)}
            required={field.required}
            disabled={disabled}
            placeholder={field.placeholder ?? undefined}
            className={fieldInputClassName}
          />
        )}
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
