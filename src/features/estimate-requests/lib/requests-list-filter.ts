import type { WorkspaceRequestListItem } from "@/features/estimate-requests/server/workspace-requests";

export type RequestListFilterField =
  | "requestNumber"
  | "status"
  | "customerName"
  | "customerEmail"
  | "customerPhone"
  | "streetAddress"
  | "city"
  | "postalCode"
  | "propertyType"
  | "floorArea"
  | "estimateTitle"
  | "attachmentCount";

export type RequestListFilterLogic = "and" | "or";

export type TextFilterOperator = "contains" | "equals" | "notEquals" | "startsWith" | "endsWith";
export type NumericFilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte";
export type StatusFilterOperator = "equals" | "notEquals";
export type RequestListFilterOperator =
  | TextFilterOperator
  | NumericFilterOperator
  | StatusFilterOperator;

export interface RequestListFilterCondition {
  id: string;
  field: RequestListFilterField;
  operator: RequestListFilterOperator;
  value: string;
}

export interface RequestListFilterState {
  conditions: RequestListFilterCondition[];
  logic: RequestListFilterLogic;
}

export type RequestListDateField = "received" | "updated";

export interface RequestListDateRange {
  field: RequestListDateField;
  from: Date | null;
  to: Date | null;
}

export const EMPTY_REQUEST_LIST_FILTER: RequestListFilterState = {
  conditions: [],
  logic: "and",
};

export const EMPTY_REQUEST_LIST_DATE_RANGE: RequestListDateRange = {
  field: "received",
  from: null,
  to: null,
};

const TEXT_FIELDS = new Set<RequestListFilterField>([
  "requestNumber",
  "customerName",
  "customerEmail",
  "customerPhone",
  "streetAddress",
  "city",
  "postalCode",
  "propertyType",
  "estimateTitle",
]);

const STATUS_FIELDS = new Set<RequestListFilterField>(["status"]);

export const REQUEST_LIST_FILTER_FIELDS: RequestListFilterField[] = [
  "requestNumber",
  "status",
  "customerName",
  "customerEmail",
  "customerPhone",
  "streetAddress",
  "city",
  "postalCode",
  "propertyType",
  "floorArea",
  "estimateTitle",
  "attachmentCount",
];

export const REQUEST_LIST_STATUS_VALUES = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] as const;

export function isTextRequestListFilterField(field: RequestListFilterField): boolean {
  return TEXT_FIELDS.has(field);
}

export function isStatusRequestListFilterField(field: RequestListFilterField): boolean {
  return STATUS_FIELDS.has(field);
}

export function defaultOperatorForRequestListField(
  field: RequestListFilterField,
): RequestListFilterOperator {
  if (isStatusRequestListFilterField(field)) {
    return "equals";
  }
  return isTextRequestListFilterField(field) ? "contains" : "eq";
}

export function operatorsForRequestListField(
  field: RequestListFilterField,
): RequestListFilterOperator[] {
  if (isStatusRequestListFilterField(field)) {
    return ["equals", "notEquals"];
  }
  if (isTextRequestListFilterField(field)) {
    return ["contains", "equals", "notEquals", "startsWith", "endsWith"];
  }
  return ["eq", "neq", "gt", "gte", "lt", "lte"];
}

function getFieldValues(
  request: WorkspaceRequestListItem,
  field: RequestListFilterField,
): { text?: string; numeric?: number } {
  switch (field) {
    case "requestNumber":
      return { text: request.requestNumber ?? "" };
    case "status":
      return { text: request.status };
    case "customerName":
      return { text: request.customerFullName ?? "" };
    case "customerEmail":
      return { text: request.customerEmail ?? "" };
    case "customerPhone":
      return { text: request.customerPhone ?? "" };
    case "streetAddress":
      return { text: request.streetAddress ?? "" };
    case "city":
      return { text: request.city ?? "" };
    case "postalCode":
      return { text: request.postalCode ?? "" };
    case "propertyType":
      return { text: request.propertyType ?? "" };
    case "floorArea":
      return { numeric: request.floorArea ?? 0 };
    case "estimateTitle":
      return { text: request.estimateTitle ?? "" };
    case "attachmentCount":
      return { numeric: request.attachmentCount };
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
  request: WorkspaceRequestListItem,
  condition: RequestListFilterCondition,
): boolean {
  const { text, numeric } = getFieldValues(request, condition.field);

  if (isTextRequestListFilterField(condition.field) || isStatusRequestListFilterField(condition.field)) {
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

function activeConditions(filter: RequestListFilterState): RequestListFilterCondition[] {
  return filter.conditions.filter((condition) => condition.value.trim().length > 0);
}

export function requestMatchesFilters(
  request: WorkspaceRequestListItem,
  filter: RequestListFilterState,
): boolean {
  const conditions = activeConditions(filter);
  if (conditions.length === 0) {
    return true;
  }

  if (filter.logic === "and") {
    return conditions.every((condition) => evaluateCondition(request, condition));
  }

  return conditions.some((condition) => evaluateCondition(request, condition));
}

export function hasActiveRequestListFilters(filter: RequestListFilterState): boolean {
  return activeConditions(filter).length > 0;
}

export function hasActiveRequestDateRange(range: RequestListDateRange): boolean {
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

export function resolveRequestListDate(
  request: WorkspaceRequestListItem,
  field: RequestListDateField,
): Date {
  return field === "received" ? request.createdAt : request.updatedAt;
}

export function requestMatchesDateRange(
  request: WorkspaceRequestListItem,
  range: RequestListDateRange,
): boolean {
  if (!hasActiveRequestDateRange(range)) {
    return true;
  }

  const timestamp = resolveRequestListDate(request, range.field).getTime();
  if (range.from && timestamp < startOfDay(range.from).getTime()) {
    return false;
  }
  if (range.to && timestamp > endOfDay(range.to).getTime()) {
    return false;
  }

  return true;
}

export function requestMatchesSearch(request: WorkspaceRequestListItem, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    request.requestNumber,
    request.customerFullName,
    request.customerEmail,
    request.customerPhone,
    request.streetAddress,
    request.city,
    request.postalCode,
    request.propertyType,
    request.floorArea != null ? String(request.floorArea) : null,
    request.estimateTitle,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

export function requestIsVisible(
  request: WorkspaceRequestListItem,
  options: {
    searchQuery: string;
    filter: RequestListFilterState;
    dateRange: RequestListDateRange;
  },
): boolean {
  return (
    requestMatchesSearch(request, options.searchQuery) &&
    requestMatchesFilters(request, options.filter) &&
    requestMatchesDateRange(request, options.dateRange)
  );
}

export function countMatchingRequests(
  requests: WorkspaceRequestListItem[],
  options: {
    searchQuery: string;
    filter: RequestListFilterState;
    dateRange: RequestListDateRange;
  },
): number {
  return requests.filter((request) => requestIsVisible(request, options)).length;
}

export function createRequestListFilterCondition(
  field: RequestListFilterField,
): RequestListFilterCondition {
  return {
    id: crypto.randomUUID(),
    field,
    operator: defaultOperatorForRequestListField(field),
    value: "",
  };
}
