import type { Locale } from "@/lib/locale";

export function buildIssueAdminUrl(input: {
  origin: string;
  locale: Locale;
  number: number;
}): string {
  const normalizedOrigin = input.origin.replace(/\/+$/, "");
  return `${normalizedOrigin}/${input.locale}/dashboard/admin/issues/${input.number}`;
}
