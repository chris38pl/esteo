import type { Locale } from "@/lib/locale";
import type { IssuesRouteVariant } from "@/features/issues/lib/issues-base-path";
import { getIssueDetailPath } from "@/features/issues/lib/issues-base-path";

export function buildIssueAdminUrl(input: {
  origin: string;
  locale: Locale;
  number: number;
  variant?: IssuesRouteVariant;
}): string {
  const normalizedOrigin = input.origin.replace(/\/+$/, "");
  const path = getIssueDetailPath(input.locale, input.variant ?? "admin", input.number);
  return `${normalizedOrigin}${path}`;
}
