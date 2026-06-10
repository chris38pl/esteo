import type { EstimateListPageItem } from "@/features/estimates/server/list-estimates-page-data";

export type EstimateListFilterField =
  | "title"
  | "status"
  | "requestNumber"
  | "customerName"
  | "customerEmail"
  | "investmentPropertyType"
  | "investmentStreet"
  | "investmentCity"
  | "totalGross"
  | "totalNet"
  | "attachmentCount"
  | "versionCount";

export type EstimateListFilterLogic = "and" | "or";

export type TextFilterOperator = "contains" | "equals" | "notEquals" | "startsWith" | "endsWith";
export type NumericFilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte";
export type StatusFilterOperator = "equals" | "notEquals";
export type EstimateListFilterOperator =
  | TextFilterOperator
  | NumericFilterOperator
  | StatusFilterOperator;

export interface EstimateListFilterCondition {
  id: string;
  field: EstimateListFilterField;
  operator: EstimateListFilterOperator;
  value: string;
}

export interface EstimateListFilterState {
  conditions: EstimateListFilterCondition[];
  logic: EstimateListFilterLogic;
}

export type EstimateListDateField = "updated" | "created" | "requestCreated";

export interface EstimateListDateRange {
  field: EstimateListDateField;
  from: Date | null;
  to: Date | null;
}

export const EMPTY_ESTIMATE_LIST_FILTER: EstimateListFilterState = {
  conditions: [],
  logic: "and",
};

export const EMPTY_ESTIMATE_LIST_DATE_RANGE: EstimateListDateRange = {
  field: "updated",
  from: null,
  to: null,
};

const TEXT_FIELDS = new Set<EstimateListFilterField>([
  "title",
  "requestNumber",
  "customerName",
  "customerEmail",
  "investmentPropertyType",
  "investmentStreet",
  "investmentCity",
]);

const STATUS_FIELDS = new Set<EstimateListFilterField>(["status"]);

export const ESTIMATE_LIST_FILTER_FIELDS: EstimateListFilterField[] = [
  "title",
  "status",
  "requestNumber",
  "customerName",
  "customerEmail",
  "investmentPropertyType",
  "investmentStreet",
  "investmentCity",
  "totalGross",
  "totalNet",
  "attachmentCount",
  "versionCount",
];

export const ESTIMATE_LIST_STATUS_VALUES = ["DRAFT", "SENT", "ARCHIVED"] as const;

export function isTextListFilterField(field: EstimateListFilterField): boolean {
  return TEXT_FIELDS.has(field);
}

export function isStatusListFilterField(field: EstimateListFilterField): boolean {
  return STATUS_FIELDS.has(field);
}

export function defaultOperatorForListField(
  field: EstimateListFilterField,
): EstimateListFilterOperator {
  if (isStatusListFilterField(field)) {
    return "equals";
  }
  return isTextListFilterField(field) ? "contains" : "eq";
}

export function operatorsForListField(
  field: EstimateListFilterField,
): EstimateListFilterOperator[] {
  if (isStatusListFilterField(field)) {
    return ["equals", "notEquals"];
  }
  if (isTextListFilterField(field)) {
    return ["contains", "equals", "notEquals", "startsWith", "endsWith"];
  }
  return ["eq", "neq", "gt", "gte", "lt", "lte"];
}

function getFieldValues(
  estimate: EstimateListPageItem,
  field: EstimateListFilterField,
): { text?: string; numeric?: number } {
  const ctx = estimate.listContext;
  const request = estimate.estimateRequest;
  const latest = estimate.latestVersion;

  switch (field) {
    case "title":
      return { text: estimate.title ?? "" };
    case "status":
      return { text: latest?.status ?? "" };
    case "requestNumber":
      return { text: request?.requestNumber ?? "" };
    case "customerName":
      return { text: ctx.customerName ?? "" };
    case "customerEmail":
      return { text: ctx.customerEmail ?? "" };
    case "investmentPropertyType":
      return { text: ctx.investmentPropertyType ?? "" };
    case "investmentStreet":
      return { text: ctx.investmentStreet ?? "" };
    case "investmentCity":
      return { text: ctx.investmentCity ?? "" };
    case "totalGross":
      return { numeric: latest ? Number(latest.totalGross) : 0 };
    case "totalNet":
      return { numeric: latest ? Number(latest.totalNet) : 0 };
    case "attachmentCount":
      return { numeric: estimate.attachmentCount };
    case "versionCount":
      return { numeric: estimate._count.versions };
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

function evaluateCondition(
  estimate: EstimateListPageItem,
  condition: EstimateListFilterCondition,
): boolean {
  const { text, numeric } = getFieldValues(estimate, condition.field);

  if (isTextListFilterField(condition.field) || isStatusListFilterField(condition.field)) {
    return evaluateTextCondition(
      text ?? "",
      condition.operator as TextFilterOperator | StatusFilterOperator,
      condition.value,
    );
  }

  return evaluateNumericCondition(
    numeric ?? 0,
    condition.operator as NumericFilterOperator,
    condition.value,
  );
}

function activeConditions(filter: EstimateListFilterState): EstimateListFilterCondition[] {
  return filter.conditions.filter((condition) => condition.value.trim().length > 0);
}

export function estimateMatchesFilters(
  estimate: EstimateListPageItem,
  filter: EstimateListFilterState,
): boolean {
  const conditions = activeConditions(filter);
  if (conditions.length === 0) {
    return true;
  }

  if (filter.logic === "and") {
    return conditions.every((condition) => evaluateCondition(estimate, condition));
  }

  return conditions.some((condition) => evaluateCondition(estimate, condition));
}

export function hasActiveListFilters(filter: EstimateListFilterState): boolean {
  return activeConditions(filter).length > 0;
}

export function hasActiveDateRange(range: EstimateListDateRange): boolean {
  return range.from !== null || range.to !== null;
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

export function resolveEstimateListDate(
  estimate: EstimateListPageItem,
  field: EstimateListDateField,
): Date | null {
  switch (field) {
    case "updated":
      return estimate.latestVersion?.updatedAt ?? estimate.createdAt;
    case "created":
      return estimate.createdAt;
    case "requestCreated":
      return estimate.estimateRequest?.createdAt ?? null;
  }
}

export function estimateMatchesDateRange(
  estimate: EstimateListPageItem,
  range: EstimateListDateRange,
): boolean {
  if (!hasActiveDateRange(range)) {
    return true;
  }

  const date = resolveEstimateListDate(estimate, range.field);
  if (!date) {
    return false;
  }

  const timestamp = date.getTime();
  if (range.from && timestamp < startOfDay(range.from).getTime()) {
    return false;
  }
  if (range.to && timestamp > endOfDay(range.to).getTime()) {
    return false;
  }

  return true;
}

export function estimateMatchesSearch(estimate: EstimateListPageItem, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const ctx = estimate.listContext;
  const request = estimate.estimateRequest;
  const haystack = [
    estimate.title,
    request?.requestNumber,
    ctx.customerName,
    ctx.customerEmail,
    ctx.investmentPropertyType,
    ctx.investmentStreet,
    ctx.investmentCity,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

export function estimateIsVisible(
  estimate: EstimateListPageItem,
  options: {
    searchQuery: string;
    filter: EstimateListFilterState;
    dateRange: EstimateListDateRange;
  },
): boolean {
  return (
    estimateMatchesSearch(estimate, options.searchQuery) &&
    estimateMatchesFilters(estimate, options.filter) &&
    estimateMatchesDateRange(estimate, options.dateRange)
  );
}

export function countMatchingEstimates(
  estimates: EstimateListPageItem[],
  options: {
    searchQuery: string;
    filter: EstimateListFilterState;
    dateRange: EstimateListDateRange;
  },
): number {
  return estimates.filter((estimate) => estimateIsVisible(estimate, options)).length;
}

export function createListFilterCondition(
  field: EstimateListFilterField,
): EstimateListFilterCondition {
  return {
    id: crypto.randomUUID(),
    field,
    operator: defaultOperatorForListField(field),
    value: "",
  };
}
