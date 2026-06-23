import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { SyncDashboardBreadcrumbDetail } from "@/components/layout/dashboard-top-nav/sync-dashboard-breadcrumb-detail";
import {
  AdminIssueDetailPanel,
  type AdminIssueCurrentUserClient,
  type AdminIssueDetailClient,
} from "@/features/issues/components/admin-issue-detail-panel";
import { serializeIssueActivityLogs } from "@/features/issues/lib/serialize-issue-activity";
import { serializeIssueComments } from "@/features/issues/lib/serialize-issue-comments";
import { getIssueByNumber } from "@/features/issues/server/repository";
import { resolveRequestLocale } from "@/i18n/request-locale";
import { isAvatarPreset } from "@/lib/avatars/user-avatar-presets";
import type { Locale } from "@/lib/locale";
import { assertIssueViewerAccess } from "@/server/auth/require-issue-viewer";

function serializeIssueForClient(
  issue: NonNullable<Awaited<ReturnType<typeof getIssueByNumber>>>,
): AdminIssueDetailClient {
  return {
    ...issue,
    attachments: issue.attachments.map((attachment) => ({
      ...attachment,
      fileSizeBytes: Number(attachment.fileSizeBytes),
    })),
    comments: serializeIssueComments(issue.comments),
    activityLogs: serializeIssueActivityLogs(issue.activityLogs),
  };
}

function serializeCurrentUserForClient(
  user: Awaited<ReturnType<typeof assertIssueViewerAccess>>,
): AdminIssueCurrentUserClient {
  return {
    id: user.id,
    avatarUrl: user.avatarUrl,
    avatarPreset: isAvatarPreset(user.avatarPreset) ? user.avatarPreset : null,
  };
}

export default async function QaIssueDetailPage({
  params,
}: {
  params: Promise<{ locale: string; number: string }>;
}) {
  const { locale: localeParam, number: numberParam } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);
  const number = Number.parseInt(numberParam, 10);

  setRequestLocale(resolvedLocale);
  const currentUser = await assertIssueViewerAccess(resolvedLocale);

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
      <AdminIssueDetailPanel
        issue={serializeIssueForClient(issue)}
        currentUser={serializeCurrentUserForClient(currentUser)}
        locale={resolvedLocale}
        issuesVariant="qa"
      />
    </>
  );
}
