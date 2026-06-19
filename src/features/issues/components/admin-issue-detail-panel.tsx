"use client";

import Link from "next/link";
import {
  AlignLeft,
  ChevronDown,
  Copy,
  ImageIcon,
  Link2,
  ListOrdered,
  Settings2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { IssuePriorityBadge } from "@/features/issues/components/issue-priority-badge";
import { IssueStatusBadge } from "@/features/issues/components/issue-status-badge";
import { IssueTypeBadge } from "@/features/issues/components/issue-type-badge";
import { IssueDetailAttachments } from "@/features/issues/components/issue-detail-attachments";
import { issueFormFieldClassName } from "@/features/issues/components/issue-form-fields";
import { buildCursorPrompt } from "@/features/issues/lib/build-cursor-prompt";
import { buildIssueAdminUrl } from "@/features/issues/lib/build-issue-admin-url";
import { getIssuesBasePath, type IssuesRouteVariant } from "@/features/issues/lib/issues-base-path";
import { parseIssueContext } from "@/features/issues/lib/issue-context";
import {
  updateIssueStatusAction,
} from "@/features/issues/server/admin-actions";
import type { AdminIssueDetail } from "@/features/issues/server/repository";
import {
  estimateOutlineButtonClassName,
} from "@/features/estimates/components/estimate-action-button-styles";
import { EstimateEditorLayoutStyles } from "@/features/estimates/components/estimate-editor-layout-styles";
import { estimateEditorMaxWidthClass } from "@/features/estimates/lib/estimate-layout-config";
import "@/features/estimates/styles/estimate-editor-layout.css";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export type AdminIssueDetailClient = Omit<AdminIssueDetail, "attachments"> & {
  attachments: Array<
    Omit<AdminIssueDetail["attachments"][number], "fileSizeBytes"> & {
      fileSizeBytes: number;
    }
  >;
};

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
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-sm",
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
      <div className="min-w-0 divide-y divide-border/40">{children}</div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:gap-4">
      <dt className="shrink-0 text-xs font-medium text-muted-foreground sm:w-36">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm leading-snug break-words text-foreground">{children}</dd>
    </div>
  );
}

function SidebarDetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-3.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm leading-snug break-words text-foreground">{children}</dd>
    </div>
  );
}

function DescriptionBlock({ description }: { description: string }) {
  const t = useTranslations("issues");
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
    <div className="px-5 py-4">
      {description ? (
        <div className="space-y-2">
          <p
            ref={descriptionRef}
            className={cn(
              "whitespace-pre-wrap text-sm leading-relaxed text-foreground",
              !expanded && "line-clamp-6 md:line-clamp-10",
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
              {expanded ? t("admin.detail.showLess") : t("admin.detail.showMore")}
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

export function AdminIssueDetailPanel({
  issue,
  locale,
  issuesVariant = "admin",
}: {
  issue: AdminIssueDetailClient;
  locale: Locale;
  issuesVariant?: IssuesRouteVariant;
}) {
  const t = useTranslations("issues");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"OPEN" | "RESOLVED">(
    issue.status === "RESOLVED" ? "RESOLVED" : "OPEN",
  );

  const context = parseIssueContext(issue.context);
  const listHref = getIssuesBasePath(locale, issuesVariant);
  const dateLocale = locale === "pl" ? "pl-PL" : "en-US";

  const formatDateTime = (value: Date | string) =>
    new Intl.DateTimeFormat(dateLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));

  const reportedByLabel =
    issue.reportedBy.name?.trim() || issue.reportedBy.email || "—";

  const hasAdditionalDetails =
    Boolean(issue.reproductionSteps) ||
    Boolean(issue.expectedBehavior) ||
    Boolean(issue.actualBehavior);

  async function copyText(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error(t("admin.copyFailed"));
    }
  }

  function handleStatusChange(nextStatus: "OPEN" | "RESOLVED") {
    setStatus(nextStatus);

    startTransition(async () => {
      const result = await updateIssueStatusAction(
        { number: issue.number, status: nextStatus },
        locale,
      );

      if (!result.success) {
        toast.error(result.error);
        setStatus(issue.status === "RESOLVED" ? "RESOLVED" : "OPEN");
        return;
      }

      router.refresh();
      toast.success(t("admin.statusUpdated"));
    });
  }

  return (
    <div className={cn("mx-auto min-w-0 w-full space-y-6 pb-8", estimateEditorMaxWidthClass)}>
      <EstimateEditorLayoutStyles />

      <header className="flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-xl border border-primary/15 bg-primary/10",
                "px-3 py-1 font-mono text-base font-bold tabular-nums tracking-tight text-primary sm:text-lg",
              )}
            >
              #{issue.number}
            </span>
            <h1 className="min-w-0 flex-1 text-2xl font-semibold tracking-tight text-foreground">
              {issue.title}
            </h1>
            <IssueStatusBadge
              status={issue.status}
              label={t(`status.${issue.status}`)}
              className="ml-1 shrink-0 px-2.5 py-1 text-xs sm:ml-2"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <IssueTypeBadge label={t(`type.${issue.type}`)} />
            <IssuePriorityBadge
              priority={issue.priority}
              label={t(`priority.${issue.priority}`)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("admin.detail.metaLine", {
              created: formatDateTime(issue.createdAt),
              updated: formatDateTime(issue.updatedAt),
            })}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <Button variant="outline" size="sm" className={estimateOutlineButtonClassName} asChild>
            <Link href={listHref}>{t("admin.detail.backToList")}</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={estimateOutlineButtonClassName}
            onClick={() => copyText(buildCursorPrompt(issue), t("admin.promptCopied"))}
          >
            <Copy className="size-4" />
            {t("admin.copyPrompt")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={estimateOutlineButtonClassName}
            onClick={() =>
              copyText(
                buildIssueAdminUrl({
                  origin: window.location.origin,
                  locale,
                  number: issue.number,
                  variant: issuesVariant,
                }),
                t("admin.urlCopied"),
              )
            }
          >
            <Link2 className="size-4" />
            {t("admin.copyUrl")}
          </Button>
        </div>
      </header>

      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <DetailCard icon={AlignLeft} title={t("admin.description")}>
            <DescriptionBlock description={issue.description} />
          </DetailCard>

          {hasAdditionalDetails ? (
            <DetailCard icon={ListOrdered} title={t("admin.detail.additionalSection")}>
              {issue.reproductionSteps ? (
                <DetailRow label={t("form.reproductionSteps")}>
                  <span className="whitespace-pre-wrap">{issue.reproductionSteps}</span>
                </DetailRow>
              ) : null}
              {issue.expectedBehavior ? (
                <DetailRow label={t("form.expectedBehavior")}>
                  <span className="whitespace-pre-wrap">{issue.expectedBehavior}</span>
                </DetailRow>
              ) : null}
              {issue.actualBehavior ? (
                <DetailRow label={t("form.actualBehavior")}>
                  <span className="whitespace-pre-wrap">{issue.actualBehavior}</span>
                </DetailRow>
              ) : null}
            </DetailCard>
          ) : null}

          {issue.attachments.length > 0 ? (
            <DetailCard icon={ImageIcon} title={t("admin.screenshots")}>
              <IssueDetailAttachments attachments={issue.attachments} locale={locale} />
            </DetailCard>
          ) : null}
        </div>

        <aside className="min-w-0">
          <DetailCard icon={Settings2} title={t("admin.detail.detailsSection")}>
            <div className="px-5 py-3.5">
              <p className="mb-2 text-xs font-medium text-muted-foreground">{t("admin.status")}</p>
              <Select
                value={status}
                onValueChange={(value) => handleStatusChange(value as "OPEN" | "RESOLVED")}
                disabled={pending}
              >
                <SelectTrigger className={cn(issueFormFieldClassName, "w-full")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">{t("status.OPEN")}</SelectItem>
                  <SelectItem value="RESOLVED">{t("status.RESOLVED")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <SidebarDetailRow label={t("form.type")}>
              <IssueTypeBadge label={t(`type.${issue.type}`)} />
            </SidebarDetailRow>
            <SidebarDetailRow label={t("form.priority")}>
              <IssuePriorityBadge
                priority={issue.priority}
                label={t(`priority.${issue.priority}`)}
              />
            </SidebarDetailRow>
            <SidebarDetailRow label={t("admin.environment")}>{issue.environment}</SidebarDetailRow>
            <SidebarDetailRow label={t("admin.device")}>
              {issue.deviceType.toLowerCase()} ({issue.viewportWidth}×{issue.viewportHeight})
            </SidebarDetailRow>
            <SidebarDetailRow label={t("admin.pageUrl")}>
              <span className="break-all font-mono text-xs">{issue.pageUrl}</span>
            </SidebarDetailRow>
            <SidebarDetailRow label={t("admin.context")}>
              <span className="break-all font-mono text-xs">
                {context ? JSON.stringify(context) : "—"}
              </span>
            </SidebarDetailRow>
            <SidebarDetailRow label={t("admin.detail.locale")}>{issue.locale}</SidebarDetailRow>
            <SidebarDetailRow label={t("admin.detail.reportedBy")}>{reportedByLabel}</SidebarDetailRow>
            <SidebarDetailRow label={t("admin.detail.createdAt")}>
              {formatDateTime(issue.createdAt)}
            </SidebarDetailRow>
            <SidebarDetailRow label={t("admin.detail.updatedAt")}>
              {formatDateTime(issue.updatedAt)}
            </SidebarDetailRow>
          </DetailCard>
        </aside>
      </div>
    </div>
  );
}
