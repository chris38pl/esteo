import type { SelectOption } from "@/features/industry-fields/schemas/definition";

export type FieldSelectMode = "single" | "multi";

export type ParsedFieldSelectConfig = {
  selectMode: FieldSelectMode;
  tiles: boolean;
  choices: SelectOption[];
};

export function parseFieldSelectConfig(
  options: unknown,
  fieldKey: string,
): ParsedFieldSelectConfig {
  if (Array.isArray(options)) {
    return {
      selectMode: fieldKey === "product_categories" ? "multi" : "single",
      tiles:
        fieldKey === "property_type" ||
        fieldKey === "product_categories" ||
        fieldKey === "building_type",
      choices: options as SelectOption[],
    };
  }

  if (options && typeof options === "object" && "choices" in options) {
    const record = options as {
      selectMode?: FieldSelectMode;
      tiles?: boolean;
      choices: SelectOption[];
    };
    return {
      selectMode: record.selectMode ?? "single",
      tiles: record.tiles ?? false,
      choices: record.choices ?? [],
    };
  }

  return { selectMode: "single", tiles: false, choices: [] };
}

export function parseMultiSelectStoredValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  }
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
    }
  } catch {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

export function serializeMultiSelectValue(values: string[]): string {
  return JSON.stringify(values);
}

import { getIndustryOptionLabel } from "@/features/estimate-requests/config/industry-option-labels";
import type { Locale } from "@/lib/locale";

export function formatMultiSelectForBrief(
  values: string[],
  fieldKey: string,
  locale: Locale,
): string {
  return values
    .map((value) => getIndustryOptionLabel(fieldKey, value, locale, "label"))
    .join(", ");
}
