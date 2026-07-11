import type { EstimateRequestStatus } from "@prisma/client";
import { ArrowLeft, Paperclip } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminEstimateRequestDetail } from "@/features/estimate-requests/server/admin-estimate-requests";
import { AdminEstimateRequestDetailActions } from "@/features/estimate-requests/components/admin-estimate-request-detail-actions";
import { getServerTranslations, resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { assertPlatformAdminAccess } from "@/server/auth/require-platform-admin";

const STATUS_STYLES: Record<EstimateRequestStatus, string> = {
  PENDING:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300",
  PROCESSING:
    "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300",
  COMPLETED:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
  FAILED:
    "border-red-500/20 bg-red-500/10 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300",
};

function formatDateTime(locale: string, value: Date): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(value);
}

function StatusBadge({ status, label }: { status: EstimateRequestStatus; label: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn("rounded-md border px-2.5 py-1 text-xs font-semibold", STATUS_STYLES[status])}
    >
      {label}
    </Badge>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="border-b border-border/60 px-5 py-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <div className="divide-y divide-border/40">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 px-5 py-3.5">
      <dt className="w-44 shrink-0 text-xs font-medium text-muted-foreground pt-0.5">{label}</dt>
      <dd className={cn("flex-1 text-sm leading-snug", mono && "font-mono text-xs break-all")}>
        {children}
      </dd>
    </div>
  );
}

export default async function AdminEstimateRequestDetailPage({
  params,
}: {
  params: Promise<{ locale: string; requestId: string }>;
}) {
  const { locale: localeParam, requestId } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  setRequestLocale(resolvedLocale);

  await assertPlatformAdminAccess(resolvedLocale);

  const [t, request] = await Promise.all([
    getServerTranslations(resolvedLocale, "admin.estimateRequests"),
    getAdminEstimateRequestDetail(requestId),
  ]);

  if (!request) notFound();

  const listHref = `/${resolvedLocale}/dashboard/admin/estimate-requests`;

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Button variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground" asChild>
        <Link href={listHref}>
          <ArrowLeft className="size-4" />
          {t("detail.backToList")}
        </Link>
      </Button>

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {request.requestNumber
                ? `${t("detail.requestLabel")} ${request.requestNumber}`
                : t("detail.requestLabel")}
            </h1>
            <StatusBadge status={request.status} label={t(`status.${request.status}`)} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{request.workspace.name}</p>
        </div>

        <AdminEstimateRequestDetailActions
          requestId={request.id}
          requestNumber={request.requestNumber}
          locale={resolvedLocale}
          deletedAt={request.deletedAt}
        />
      </div>

      {/* Two-column detail grid */}
      <dl className="grid gap-6 lg:grid-cols-2">
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-6">
          <DetailCard title={t("detail.customerSection")}>
            <DetailRow label={t("detail.name")}>
              {request.customerData?.fullName ?? "-"}
            </DetailRow>
            <DetailRow label={t("detail.email")}>
              {request.customerData?.email ? (
                <a
                  href={`mailto:${request.customerData.email}`}
                  className="text-primary hover:underline"
                >
                  {request.customerData.email}
                </a>
              ) : (
                "-"
              )}
            </DetailRow>
            <DetailRow label={t("detail.phone")}>
              {request.customerData?.phone ?? "-"}
            </DetailRow>
          </DetailCard>

          <DetailCard title={t("detail.projectSection")}>
            <DetailRow label={t("detail.description")}>
              <span className="whitespace-pre-wrap leading-relaxed">
                {request.projectDescription}
              </span>
            </DetailRow>
            <DetailRow label={t("detail.preferredStartDate")}>
              {request.customerData?.project?.preferredStartDate ?? "-"}
            </DetailRow>
          </DetailCard>

          <DetailCard title={t("detail.addressSection")}>
            <DetailRow label={t("detail.streetAddress")}>
              {request.address?.streetAddress ?? "-"}
            </DetailRow>
            <DetailRow label={t("detail.city")}>{request.address?.city ?? "-"}</DetailRow>
            <DetailRow label={t("detail.postalCode")}>
              {request.address?.postalCode ?? "-"}
            </DetailRow>
            <DetailRow label={t("detail.voivodeship")}>
              {request.address?.voivodeship ?? "-"}
            </DetailRow>
          </DetailCard>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-6">
          <DetailCard title={t("detail.workspaceSection")}>
            <DetailRow label={t("detail.workspaceName")}>{request.workspace.name}</DetailRow>
            <DetailRow label={t("detail.industry")}>
              {t(`industries.${request.workspace.industry}`)}
            </DetailRow>
            <DetailRow label={t("detail.slug")} mono>
              {request.workspace.slug}
            </DetailRow>
          </DetailCard>

          <DetailCard title={t("detail.metaSection")}>
            <DetailRow label={t("detail.requestId")} mono>
              {request.id}
            </DetailRow>
            <DetailRow label={t("detail.createdAt")}>
              {formatDateTime(resolvedLocale, request.createdAt)}
            </DetailRow>
            <DetailRow label={t("detail.updatedAt")}>
              {formatDateTime(resolvedLocale, request.updatedAt)}
            </DetailRow>
            {request.deletedAt ? (
              <DetailRow label={t("detail.deletedAt")}>
                {formatDateTime(resolvedLocale, request.deletedAt)}
              </DetailRow>
            ) : null}
            <DetailRow label={t("detail.attachments")}>
              <span className="flex items-center gap-1.5">
                <Paperclip className="size-3.5 text-muted-foreground" />
                {t("detail.attachmentCount", { count: request.attachmentCount })}
              </span>
            </DetailRow>
          </DetailCard>
        </div>
      </dl>
    </div>
  );
}
