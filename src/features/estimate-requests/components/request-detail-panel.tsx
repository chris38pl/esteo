"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, Paperclip } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { EstimateContextCards } from "@/features/estimates/components/estimate-context-cards";
import { EstimateEditorLayoutStyles } from "@/features/estimates/components/estimate-editor-layout-styles";
import { estimateEditorMaxWidthClass } from "@/features/estimates/lib/estimate-layout-config";
import { RequestStatusBadge } from "@/features/estimate-requests/components/request-status-badge";
import type { WorkspaceRequestDetail } from "@/features/estimate-requests/server/workspace-requests";
import {
  formatPreferredStartDate,
  formatVoivodeship,
} from "@/features/estimate-requests/lib/format-request-display";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-sm">
      <div className="border-b border-border/60 px-5 py-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
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
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:gap-4">
      <dt className="w-44 shrink-0 text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm leading-snug text-foreground">{children}</dd>
    </div>
  );
}

interface RequestDetailPanelProps {
  request: WorkspaceRequestDetail;
  workspaceSlug: string;
  locale: Locale;
  investmentPropertyType: string | null;
}

export function RequestDetailPanel({
  request,
  workspaceSlug,
  locale,
  investmentPropertyType,
}: RequestDetailPanelProps) {
  const t = useTranslations("requests");
  const dateLocale = locale === "pl" ? "pl-PL" : "en-US";

  const formatDateTime = (value: Date) =>
    new Intl.DateTimeFormat(dateLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(value);

  const listHref = `/${locale}/dashboard/${workspaceSlug}/requests`;
  const estimateHref = request.estimate
    ? `/${locale}/dashboard/${workspaceSlug}/estimates/${request.estimate.id}`
    : null;

  const headerTitle =
    request.requestNumber ?? t("detail.requestLabel");

  return (
    <div className={cn("mx-auto min-w-0 w-full space-y-6 pb-8", estimateEditorMaxWidthClass)}>
      <EstimateEditorLayoutStyles />
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {t("detail.eyebrow")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{headerTitle}</h1>
            <RequestStatusBadge
              status={request.status}
              label={t(`status.${request.status}`)}
              className="px-2.5 py-1 text-xs"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("detail.metaLine", {
              created: formatDateTime(request.createdAt),
              updated: formatDateTime(request.updatedAt),
            })}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" asChild>
            <Link href={listHref}>{t("detail.backToList")}</Link>
          </Button>
          {estimateHref ? (
            <Button size="sm" className="gap-1.5 rounded-xl" asChild>
              <Link href={estimateHref}>
                {t("detail.openEstimate")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      </header>

      <EstimateContextCards
        requestNumber={request.requestNumber}
        customerName={request.customerData?.fullName}
        customerEmail={request.customerData?.email}
        investmentPropertyType={investmentPropertyType}
        investmentStreet={request.address?.streetAddress}
        investmentCity={request.address?.city}
        requestCreatedAt={request.createdAt}
        updatedAt={request.updatedAt}
        locale={locale}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <DetailCard title={t("detail.customerSection")}>
            <DetailRow label={t("detail.name")}>
              {request.customerData?.fullName ?? "—"}
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
                "—"
              )}
            </DetailRow>
            <DetailRow label={t("detail.phone")}>
              {request.customerData?.phone ?? "—"}
            </DetailRow>
          </DetailCard>

          <DetailCard title={t("detail.projectSection")}>
            <DetailRow label={t("detail.description")}>
              <span className="whitespace-pre-wrap leading-relaxed">
                {request.projectDescription}
              </span>
            </DetailRow>
            <DetailRow label={t("detail.preferredStartDate")}>
              {formatPreferredStartDate(
                request.customerData?.project?.preferredStartDate,
                locale,
              )}
            </DetailRow>
            <DetailRow label={t("detail.attachments")}>
              <span className="inline-flex items-center gap-1.5">
                <Paperclip className="size-3.5 text-muted-foreground" />
                {t("detail.attachmentCount", { count: request.attachmentCount })}
              </span>
            </DetailRow>
          </DetailCard>
        </div>

        <div className="space-y-6">
          <DetailCard title={t("detail.addressSection")}>
            <DetailRow label={t("detail.streetAddress")}>
              {request.address?.streetAddress ?? "—"}
            </DetailRow>
            <DetailRow label={t("detail.city")}>{request.address?.city ?? "—"}</DetailRow>
            <DetailRow label={t("detail.postalCode")}>
              {request.address?.postalCode ?? "—"}
            </DetailRow>
            <DetailRow label={t("detail.voivodeship")}>
              {formatVoivodeship(request.address?.voivodeship, locale)}
            </DetailRow>
          </DetailCard>

          {request.industryFields.length > 0 ? (
            <DetailCard title={t("detail.industrySection")}>
              {request.industryFields.map((field) => (
                <DetailRow key={field.key} label={field.label}>
                  {field.value}
                </DetailRow>
              ))}
            </DetailCard>
          ) : null}

          <DetailCard title={t("detail.estimateSection")}>
            {request.estimate && estimateHref ? (
              <DetailRow label={t("detail.linkedEstimate")}>
                <Link
                  href={estimateHref}
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  {request.estimate.title ?? t("detail.openEstimate")}
                  <ExternalLink className="size-3.5" />
                </Link>
              </DetailRow>
            ) : (
              <DetailRow label={t("detail.linkedEstimate")}>
                <span className="text-muted-foreground">{t("detail.noEstimateYet")}</span>
              </DetailRow>
            )}
          </DetailCard>
        </div>
      </div>
    </div>
  );
}
