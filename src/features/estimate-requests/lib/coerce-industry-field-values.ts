import { parseFieldSelectConfig } from "@/features/industry-fields/lib/field-select-config";
import type { IndustryFieldForDocument } from "@/features/industry-fields/server/get-fields-for-workspace";
import type { FieldValueInput } from "@/features/industry-fields/server/map-field-value";

export type IndustryFieldsPayload = Record<string, string | number | boolean | null>;

export function coerceIndustryFieldValues(input: {
  fields: IndustryFieldForDocument[];
  values: IndustryFieldsPayload;
}): Record<string, FieldValueInput> {
  const definitionByKey = new Map(input.fields.map((field) => [field.key, field]));
  const coerced: Record<string, FieldValueInput> = {};

  for (const [key, value] of Object.entries(input.values)) {
    const definition = definitionByKey.get(key);
    if (!definition || value === null || value === "") {
      coerced[key] = value;
      continue;
    }

    switch (definition.valueType) {
      case "NUMBER":
        coerced[key] = typeof value === "number" ? value : Number(value);
        break;
      case "BOOLEAN":
        coerced[key] = typeof value === "boolean" ? value : value === "true";
        break;
      case "DATE":
        coerced[key] = new Date(`${String(value)}T00:00:00.000Z`);
        break;
      case "TEXT": {
        const selectConfig = parseFieldSelectConfig(definition.options, definition.key);
        if (selectConfig.selectMode === "multi" || definition.key === "product_categories" || definition.key === "project_types") {
          coerced[key] = String(value).trim();
          break;
        }
        coerced[key] = String(value).trim();
        break;
      }
      default:
        coerced[key] = String(value).trim();
        break;
    }
  }

  return coerced;
}
