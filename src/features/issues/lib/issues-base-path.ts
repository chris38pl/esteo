import type { Locale } from "@/lib/locale";

export type IssuesRouteVariant = "admin" | "qa";

export function getIssuesBasePath(locale: Locale, variant: IssuesRouteVariant): string {
  return `/${locale}/dashboard/${variant}/issues`;
}

export function getIssueDetailPath(
  locale: Locale,
  variant: IssuesRouteVariant,
  number: number,
): string {
  return `${getIssuesBasePath(locale, variant)}/${number}`;
}
