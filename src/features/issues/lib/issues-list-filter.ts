import type { IssueStatus, IssueType } from "@prisma/client";

import type { AdminIssueListItem } from "@/features/issues/server/repository";

export type IssueTypeCategory = "all" | "defect" | "feature";

export const ISSUE_DEFECT_TYPES: IssueType[] = ["BUG", "UX", "PERFORMANCE", "AI_EXTRACTION"];
export const ISSUE_FEATURE_TYPES: IssueType[] = ["FEATURE"];

export const ISSUE_LIST_STATUS_VALUES: IssueStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "ON_HOLD",
  "RESOLVED",
  "ARCHIVED",
];

export interface IssuesListDateRange {
  from: Date | null;
  to: Date | null;
}

export interface IssuesListFilterState {
  statuses: IssueStatus[];
  typeCategory: IssueTypeCategory;
}

export const EMPTY_ISSUES_LIST_DATE_RANGE: IssuesListDateRange = {
  from: null,
  to: null,
};

export const EMPTY_ISSUES_LIST_FILTER: IssuesListFilterState = {
  statuses: [],
  typeCategory: "all",
};

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

function toTimestamp(value: Date | string): number {
  return new Date(value).getTime();
}

export function hasActiveIssuesListFilters(filter: IssuesListFilterState): boolean {
  return filter.statuses.length > 0 || filter.typeCategory !== "all";
}

export function hasActiveIssuesDateRange(range: IssuesListDateRange): boolean {
  return range.from !== null || range.to !== null;
}

export function issueMatchesTypeCategory(
  issue: AdminIssueListItem,
  category: IssueTypeCategory,
): boolean {
  if (category === "all") {
    return true;
  }

  if (category === "defect") {
    return ISSUE_DEFECT_TYPES.includes(issue.type);
  }

  return ISSUE_FEATURE_TYPES.includes(issue.type);
}

export function issueMatchesStatusFilter(
  issue: AdminIssueListItem,
  statuses: IssueStatus[],
): boolean {
  if (statuses.length === 0) {
    return true;
  }

  return statuses.includes(issue.status);
}

export function issueMatchesDateRange(
  issue: AdminIssueListItem,
  range: IssuesListDateRange,
): boolean {
  if (!hasActiveIssuesDateRange(range)) {
    return true;
  }

  const timestamp = toTimestamp(issue.createdAt);

  if (range.from && timestamp < startOfDay(range.from).getTime()) {
    return false;
  }

  if (range.to && timestamp > endOfDay(range.to).getTime()) {
    return false;
  }

  return true;
}

export function issueMatchesSearch(issue: AdminIssueListItem, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    String(issue.number),
    issue.title,
    issue.type,
    issue.status,
    issue.priority,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

export function issueIsVisible(
  issue: AdminIssueListItem,
  options: {
    searchQuery: string;
    filter: IssuesListFilterState;
    dateRange: IssuesListDateRange;
  },
): boolean {
  return (
    issueMatchesSearch(issue, options.searchQuery) &&
    issueMatchesStatusFilter(issue, options.filter.statuses) &&
    issueMatchesTypeCategory(issue, options.filter.typeCategory) &&
    issueMatchesDateRange(issue, options.dateRange)
  );
}

export function countMatchingIssues(
  issues: AdminIssueListItem[],
  options: {
    searchQuery: string;
    filter: IssuesListFilterState;
    dateRange: IssuesListDateRange;
  },
): number {
  return issues.filter((issue) => issueIsVisible(issue, options)).length;
}
