import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { resolveRequestLocale } from "@/i18n/request-locale";
import { isIssueTrackerEnabled } from "@/lib/issue-tracker/guard";
import type { Locale } from "@/lib/locale";
import { assertIssueViewerAccess } from "@/server/auth/require-issue-viewer";

export default async function DashboardQaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  setRequestLocale(resolvedLocale);

  if (!isIssueTrackerEnabled()) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  await assertIssueViewerAccess(resolvedLocale);

  return children;
}
