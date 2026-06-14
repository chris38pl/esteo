"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ChevronDown,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  MapPin,
  Paperclip,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  estimateOutlineButtonClassName,
  estimatePrimaryButtonClassName,
} from "@/features/estimates/components/estimate-action-button-styles";
import { EstimateContextCards } from "@/features/estimates/components/estimate-context-cards";
import { EstimateEditorLayoutStyles } from "@/features/estimates/components/estimate-editor-layout-styles";
import { estimateEditorMaxWidthClass } from "@/features/estimates/lib/estimate-layout-config";
import "@/features/estimates/styles/estimate-editor-layout.css";
import { RequestStatusBadge } from "@/features/estimate-requests/components/request-status-badge";
import { ConvertRequestToEstimateButton } from "@/features/estimate-requests/components/convert-request-to-estimate-button";
import type { WorkspaceRequestDetail } from "@/features/estimate-requests/server/workspace-requests";
import {
  formatPreferredStartDate,
  formatVoivodeship,
} from "@/features/estimate-requests/lib/format-request-display";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const detailCardIconClassName =
  "flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/10";

function DetailCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-border/60 px-5 py-3">
        <span className={detailCardIconClassName}>
          <Icon className="size-4" aria-hidden />
        </span>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          {title}
        </h3>
      </div>
      <div className="flex min-h-0 flex-1 flex-col divide-y divide-border/40">{children}</div>
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
    <div className="flex flex-col gap-1 px-5 py-3.5 lg:flex-row lg:gap-4">
      <dt className="shrink-0 text-xs font-medium text-muted-foreground lg:w-40 xl:w-44">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm leading-snug break-words text-foreground">{children}</dd>
    </div>
  );
}

function ProjectDescriptionBlock({ description }: { description: string }) {
  const t = useTranslations("requests");
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  const updateClampedState = useCallback(() => {
    const element = descriptionRef.current;
    if (!element || expanded || !description) {
      setIsClamped(false);
      return;
    }

    setIsClamped(element.scrollHeight > element.clientHeight + 1);
  }, [description, expanded]);

  useEffect(() => {
    updateClampedState();
  }, [updateClampedState]);

  useEffect(() => {
    const element = descriptionRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateClampedState();
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [updateClampedState]);

  const showToggle = expanded || isClamped;

  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 py-4">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{t("detail.description")}</p>
      {description ? (
        <div className="space-y-2">
          <p
            ref={descriptionRef}
            className={cn(
              "whitespace-pre-wrap text-sm leading-relaxed text-foreground",
              !expanded && "line-clamp-5 md:line-clamp-10",
            )}
          >
            {description}
          </p>
          {showToggle ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {expanded ? t("detail.showLess") : t("detail.showMore")}
              <ChevronDown
                className={cn("size-4 transition-transform", expanded && "rotate-180")}
                aria-hidden
              />
            </button>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">—</p>
      )}
    </div>
  );
}

interface RequestDetailPanelProps {
  request: WorkspaceRequestDetail;
  workspaceSlug: string;
  workspaceId: string;
  canCreateEstimate: boolean;
  estimateLimitReached: boolean;
  billingHref: string | null;
  locale: Locale;
  investmentPropertyType: string | null;
}

export function RequestDetailPanel({
  request,
  workspaceSlug,
  workspaceId,
  canCreateEstimate,
  estimateLimitReached,
  billingHref,
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

  const headerTitle = request.requestNumber ?? t("detail.requestLabel");

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

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <Button variant="outline" size="sm" className={estimateOutlineButtonClassName} asChild>
            <Link href={listHref}>{t("detail.backToList")}</Link>
          </Button>
          {estimateHref ? (
            <Button size="sm" className={estimatePrimaryButtonClassName} asChild>
              <Link href={estimateHref}>
                {t("detail.openEstimate")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : !request.estimate ? (
            <ConvertRequestToEstimateButton
              requestId={request.id}
              workspaceId={workspaceId}
              workspaceSlug={workspaceSlug}
              locale={locale}
              variant="primary"
              canCreateEstimate={canCreateEstimate}
              estimateLimitReached={estimateLimitReached}
              billingHref={billingHref}
            />
          ) : null}
        </div>
      </header>

      <div className="estimate-top-band-card min-w-0">
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
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:items-start">
        <DetailCard icon={User} title={t("detail.customerSection")}>
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

        <DetailCard icon={MapPin} title={t("detail.addressSection")}>
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
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:items-start">
        <DetailCard icon={FileText} title={t("detail.projectSection")}>
          <ProjectDescriptionBlock description={request.projectDescription} />
        </DetailCard>

        <div className="flex min-w-0 flex-col gap-6">
          <DetailCard icon={CalendarClock} title={t("detail.additionalSection")}>
            {request.industryFields.map((field) => (
              <DetailRow key={field.key} label={field.label}>
                {field.value}
              </DetailRow>
            ))}
            <DetailRow label={t("detail.preferredStartDate")}>
              {formatPreferredStartDate(
                request.customerData?.project?.preferredStartDate,
                locale,
              )}
            </DetailRow>
            <DetailRow label={t("detail.attachments")}>
              <span className="inline-flex items-center gap-1.5">
                <Paperclip className="size-3.5 text-muted-foreground" aria-hidden />
                {t("detail.attachmentCount", { count: request.attachmentCount })}
              </span>
            </DetailRow>
          </DetailCard>

          <DetailCard icon={FileSpreadsheet} title={t("detail.estimateSection")}>
            {request.estimate && estimateHref ? (
              <DetailRow label={t("detail.linkedEstimate")}>
                <Link
                  href={estimateHref}
                  className="inline-flex min-w-0 items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  <span className="truncate">{request.estimate.title ?? t("detail.openEstimate")}</span>
                  <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                </Link>
              </DetailRow>
            ) : !request.estimate ? (
              <div className="px-5 py-4">
                <ConvertRequestToEstimateButton
                  requestId={request.id}
                  workspaceId={workspaceId}
                  workspaceSlug={workspaceSlug}
                  locale={locale}
                  variant="outline"
                  canCreateEstimate={canCreateEstimate}
                  estimateLimitReached={estimateLimitReached}
                  billingHref={billingHref}
                />
              </div>
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
