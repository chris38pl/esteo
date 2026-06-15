import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { SyncDashboardBreadcrumbDetail } from "@/components/layout/dashboard-top-nav/sync-dashboard-breadcrumb-detail";
import {
  AdminIssueDetailPanel,
  type AdminIssueDetailClient,
} from "@/features/issues/components/admin-issue-detail-panel";
import { getIssueByNumber } from "@/features/issues/server/repository";
import { resolveRequestLocale } from "@/i18n/request-locale";
import { isIssueTrackerEnabled } from "@/lib/issue-tracker/guard";
import type { Locale } from "@/lib/locale";
import { assertPlatformAdminAccess } from "@/server/auth/require-platform-admin";

function serializeIssueForClient(
  issue: NonNullable<Awaited<ReturnType<typeof getIssueByNumber>>>,
): AdminIssueDetailClient {
  return {
    ...issue,
    attachments: issue.attachments.map((attachment) => ({
      ...attachment,
      fileSizeBytes: Number(attachment.fileSizeBytes),
    })),
  };
}

export default async function AdminIssueDetailPage({
  params,
}: {
  params: Promise<{ locale: string; number: string }>;
}) {
  const { locale: localeParam, number: numberParam } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);
  const number = Number.parseInt(numberParam, 10);

  setRequestLocale(resolvedLocale);

  if (!isIssueTrackerEnabled()) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  await assertPlatformAdminAccess(resolvedLocale);

  if (!Number.isFinite(number) || number <= 0) {
    notFound();
  }

  const issue = await getIssueByNumber(number);

  if (!issue) {
    notFound();
  }

  return (
    <>
      <SyncDashboardBreadcrumbDetail label={`#${issue.number}`} />
      <AdminIssueDetailPanel issue={serializeIssueForClient(issue)} locale={resolvedLocale} />
    </>
  );
}
