import type { LineItemData } from "@/features/estimates/components/estimate-line-item-row";
import { calculateLineItem } from "@/features/estimates/lib/calculate-estimate";
import { itemMatchesSearch } from "@/features/estimates/lib/estimate-item-search";

export type EstimateFilterField =
  | "name"
  | "unit"
  | "quantity"
  | "unitPrice"
  | "baseUnitPrice"
  | "netValue"
  | "grossValue"
  | "vatRate";

export type EstimateFilterLogic = "and" | "or";

export type TextFilterOperator = "contains" | "equals" | "notEquals" | "startsWith" | "endsWith";
export type NumericFilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte";
export type EstimateFilterOperator = TextFilterOperator | NumericFilterOperator;

export interface EstimateFilterCondition {
  id: string;
  field: EstimateFilterField;
  operator: EstimateFilterOperator;
  value: string;
}

export interface EstimateItemsFilterState {
  conditions: EstimateFilterCondition[];
  logic: EstimateFilterLogic;
}

export const EMPTY_ESTIMATE_ITEMS_FILTER: EstimateItemsFilterState = {
  conditions: [],
  logic: "and",
};

const TEXT_FIELDS = new Set<EstimateFilterField>(["name", "unit"]);

export function getFilterFieldsForMode(advancedMode: boolean): EstimateFilterField[] {
  if (advancedMode) {
    return [
      "name",
      "unit",
      "quantity",
      "baseUnitPrice",
      "unitPrice",
      "netValue",
      "vatRate",
      "grossValue",
    ];
  }
  return ["name", "unit", "quantity", "unitPrice", "netValue", "vatRate"];
}

export function isTextFilterField(field: EstimateFilterField): boolean {
  return TEXT_FIELDS.has(field);
}

export function defaultOperatorForField(field: EstimateFilterField): EstimateFilterOperator {
  return isTextFilterField(field) ? "contains" : "eq";
}

export function operatorsForField(field: EstimateFilterField): EstimateFilterOperator[] {
  if (isTextFilterField(field)) {
    return ["contains", "equals", "notEquals", "startsWith", "endsWith"];
  }
  return ["eq", "neq", "gt", "gte", "lt", "lte"];
}

function getFieldValues(
  item: LineItemData,
  field: EstimateFilterField,
): { text?: string; numeric?: number } {
  const calc = calculateLineItem({
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    vatRate: item.vatRate,
  });

  switch (field) {
    case "name":
      return { text: item.name };
    case "unit":
      return { text: item.unit ?? "" };
    case "quantity":
      return { numeric: item.quantity };
    case "unitPrice":
      return { numeric: item.unitPrice };
    case "baseUnitPrice":
      return { numeric: item.baseUnitPrice };
    case "netValue":
      return { numeric: calc.netValue };
    case "grossValue":
      return { numeric: calc.grossValue };
    case "vatRate":
      return { numeric: item.vatRate * 100 };
  }
}

function evaluateTextCondition(
  actual: string,
  operator: TextFilterOperator,
  expected: string,
): boolean {
  const actualValue = actual.toLowerCase();
  const expectedValue = expected.trim().toLowerCase();

  switch (operator) {
    case "contains":
      return actualValue.includes(expectedValue);
    case "equals":
      return actualValue === expectedValue;
    case "notEquals":
      return actualValue !== expectedValue;
    case "startsWith":
      return actualValue.startsWith(expectedValue);
    case "endsWith":
      return actualValue.endsWith(expectedValue);
  }
}

function evaluateNumericCondition(
  actual: number,
  operator: NumericFilterOperator,
  expected: string,
): boolean {
  const expectedValue = Number.parseFloat(expected.replace(",", "."));
  if (Number.isNaN(expectedValue)) {
    return false;
  }

  switch (operator) {
    case "eq":
      return actual === expectedValue;
    case "neq":
      return actual !== expectedValue;
    case "gt":
      return actual > expectedValue;
    case "gte":
      return actual >= expectedValue;
    case "lt":
      return actual < expectedValue;
    case "lte":
      return actual <= expectedValue;
  }
}

function evaluateCondition(item: LineItemData, condition: EstimateFilterCondition): boolean {
  const { text, numeric } = getFieldValues(item, condition.field);

  if (isTextFilterField(condition.field)) {
    return evaluateTextCondition(
      text ?? "",
      condition.operator as TextFilterOperator,
      condition.value,
    );
  }

  return evaluateNumericCondition(
    numeric ?? 0,
    condition.operator as NumericFilterOperator,
    condition.value,
  );
}

function activeConditions(filter: EstimateItemsFilterState): EstimateFilterCondition[] {
  return filter.conditions.filter((condition) => condition.value.trim().length > 0);
}

export function itemMatchesFilters(
  item: LineItemData,
  filter: EstimateItemsFilterState,
): boolean {
  const conditions = activeConditions(filter);
  if (conditions.length === 0) {
    return true;
  }

  if (filter.logic === "and") {
    return conditions.every((condition) => evaluateCondition(item, condition));
  }

  return conditions.some((condition) => evaluateCondition(item, condition));
}

export function hasActiveFilters(filter: EstimateItemsFilterState): boolean {
  return activeConditions(filter).length > 0;
}

export function itemIsVisible(
  item: LineItemData,
  options: {
    searchQuery: string;
    filter: EstimateItemsFilterState;
  },
): boolean {
  return itemMatchesSearch(item, options.searchQuery) && itemMatchesFilters(item, options.filter);
}

export function countVisibleItems(
  items: LineItemData[],
  options: {
    searchQuery: string;
    filter: EstimateItemsFilterState;
  },
): number {
  return items.filter((item) => itemIsVisible(item, options)).length;
}

export function sanitizeFilterForMode(
  filter: EstimateItemsFilterState,
  advancedMode: boolean,
): EstimateItemsFilterState {
  const allowed = new Set(getFilterFieldsForMode(advancedMode));
  return {
    ...filter,
    conditions: filter.conditions.filter((condition) => allowed.has(condition.field)),
  };
}

export function createFilterCondition(field: EstimateFilterField): EstimateFilterCondition {
  return {
    id: crypto.randomUUID(),
    field,
    operator: defaultOperatorForField(field),
    value: "",
  };
}
