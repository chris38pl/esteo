"use client";

import Link from "next/link";
import {
  AlignLeft,
  CalendarClock,
  CalendarPlus,
  ChevronDown,
  Copy,
  ImageIcon,
  Link2,
  ListOrdered,
  MessageSquare,
  MoreVertical,
  Pencil,
  Settings2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type ReactNode,
} from "react";
import { appToast } from "@/components/ui/app-toast";

import { IssuePriorityBadge } from "@/features/issues/components/issue-priority-badge";
import { IssueStatusBadge } from "@/features/issues/components/issue-status-badge";
import { IssueTypeBadge } from "@/features/issues/components/issue-type-badge";
import { IssueCommentsPanel } from "@/features/issues/components/issue-comments-panel";
import { IssueDetailAttachments } from "@/features/issues/components/issue-detail-attachments";
import { IssueHistoryPanel } from "@/features/issues/components/issue-history-panel";
import { issueFormFieldClassName } from "@/features/issues/components/issue-form-fields";
import { buildCursorPrompt } from "@/features/issues/lib/build-cursor-prompt";
import { buildIssueAdminUrl } from "@/features/issues/lib/build-issue-admin-url";
import { getIssuesBasePath, type IssuesRouteVariant } from "@/features/issues/lib/issues-base-path";
import { parseIssueContext } from "@/features/issues/lib/issue-context";
import type { IssueActivityLogClient } from "@/features/issues/lib/serialize-issue-activity";
import type { IssueCommentClient } from "@/features/issues/lib/serialize-issue-comments";
import {
  type AdminIssueStatus,
  toAdminIssueStatus,
} from "@/features/issues/schemas/issue";
import { ISSUE_COMMENT_BODY_MAX_LENGTH } from "@/features/issues/schemas/issue-comment";
import {
  updateIssueDetailsAction,
  updateIssueStatusAction,
} from "@/features/issues/server/admin-actions";
import type { AdminIssueDetail } from "@/features/issues/server/repository";
import {
  estimateOutlineButtonClassName,
} from "@/features/estimates/components/estimate-action-button-styles";
import { EstimateEditorLayoutStyles } from "@/features/estimates/components/estimate-editor-layout-styles";
import { useEstimateMobileLayout } from "@/features/estimates/hooks/use-estimate-mobile-layout";
import { useMobileKeyboardViewportInset } from "@/features/estimates/hooks/use-mobile-keyboard-viewport-inset";
import {
  createMobileDismissGuardedOpenChange,
  getMobileSheetOutsideDismissHandlers,
  useIgnoreInitialOutsideDismiss,
} from "@/features/estimates/hooks/use-mobile-outside-dismiss-guard";
import { estimateEditorMaxWidthClass } from "@/features/estimates/lib/estimate-layout-config";
import "@/features/estimates/styles/estimate-editor-layout.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AvatarPreset } from "@/components/avatars/user-avatar";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export type AdminIssueDetailClient = Omit<
  AdminIssueDetail,
  "attachments" | "comments" | "activityLogs"
> & {
  attachments: Array<
    Omit<AdminIssueDetail["attachments"][number], "fileSizeBytes"> & {
      fileSizeBytes: number;
    }
  >;
  comments: IssueCommentClient[];
  activityLogs: IssueActivityLogClient[];
};

export type AdminIssueCurrentUserClient = {
  id: string;
  avatarUrl: string | null;
  avatarPreset: AvatarPreset | null;
};

const detailCardIconClassName =
  "flex size-5 shrink-0 items-center justify-center text-primary";

type IssueDetailPanelTab = "comments" | "history";

function DetailCard({
  icon: Icon,
  title,
  children,
  className,
  defaultOpen = true,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-sm",
        className,
      )}
    >
      <button
        type="button"
        className="flex w-full items-center gap-2.5 border-b border-border/60 px-5 py-3 text-left"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={detailCardIconClassName}>
          <Icon className="size-4" aria-hidden />
        </span>
        <h3 className="min-w-0 flex-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          {title}
        </h3>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? <div className="min-w-0 divide-y divide-border/40">{children}</div> : null}
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
  currentUser,
  locale,
  issuesVariant = "admin",
}: {
  issue: AdminIssueDetailClient;
  currentUser: AdminIssueCurrentUserClient;
  locale: Locale;
  issuesVariant?: IssuesRouteVariant;
}) {
  const t = useTranslations("issues");
  const router = useRouter();
  const isMobile = useEstimateMobileLayout();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<AdminIssueStatus>(toAdminIssueStatus(issue.status));
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);
  const [resolutionComment, setResolutionComment] = useState("");
  const [resolutionFixedIn, setResolutionFixedIn] = useState("");
  const [activePanelTab, setActivePanelTab] = useState<IssueDetailPanelTab>("comments");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [issueTitle, setIssueTitle] = useState(issue.title);
  const [issueDescription, setIssueDescription] = useState(issue.description);
  const [draftTitle, setDraftTitle] = useState(issue.title);
  const [draftDescription, setDraftDescription] = useState(issue.description);
  const ignoreEditOutsideDismissRef = useIgnoreInitialOutsideDismiss(editDialogOpen && isMobile);
  const editKeyboardInset = useMobileKeyboardViewportInset(editDialogOpen && isMobile);

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
  const handleEditOpenChange = createMobileDismissGuardedOpenChange(
    ignoreEditOutsideDismissRef,
    setEditDialogOpen,
  );
  const editSheetOutsideHandlers = getMobileSheetOutsideDismissHandlers(ignoreEditOutsideDismissRef);
  const editSheetStyle: CSSProperties | undefined =
    editKeyboardInset > 0
      ? {
          bottom: editKeyboardInset,
          maxHeight: `calc(100dvh - ${editKeyboardInset}px)`,
        }
      : undefined;

  async function copyText(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      appToast.success(message);
    } catch {
      appToast.error(t("admin.copyFailed"));
    }
  }

  function copyIssueUrl() {
    void copyText(
      buildIssueAdminUrl({
        origin: window.location.origin,
        locale,
        number: issue.number,
        variant: issuesVariant,
      }),
      t("admin.urlCopied"),
    );
  }

  function openEditDialog() {
    setDraftTitle(issueTitle);
    setDraftDescription(issueDescription);
    setEditDialogOpen(true);
  }

  function handleIssueDetailsSubmit() {
    const nextTitle = draftTitle.trim();
    const nextDescription = draftDescription.trim();

    if (!nextTitle || !nextDescription) {
      appToast.error(t("admin.edit.validationError"));
      return;
    }

    startTransition(async () => {
      const result = await updateIssueDetailsAction(
        {
          number: issue.number,
          title: nextTitle,
          description: nextDescription,
        },
        locale,
      );

      if (!result.success) {
        appToast.error(result.error);
        return;
      }

      setIssueTitle(nextTitle);
      setIssueDescription(nextDescription);
      setEditDialogOpen(false);
      router.refresh();
      appToast.success(t("admin.edit.success"));
    });
  }

  function submitStatusChange(
    nextStatus: AdminIssueStatus,
    options?: { resolutionComment?: string; fixedIn?: string },
  ) {
    const previousStatus = status;
    setStatus(nextStatus);

    startTransition(async () => {
      const result = await updateIssueStatusAction(
        {
          number: issue.number,
          status: nextStatus,
          resolutionComment: options?.resolutionComment,
          fixedIn: options?.fixedIn,
        },
        locale,
      );

      if (!result.success) {
        appToast.error(result.error);
        setStatus(previousStatus);
        return;
      }

      if (nextStatus === "RESOLVED") {
        setResolutionDialogOpen(false);
        setResolutionComment("");
        setResolutionFixedIn("");
      }

      router.refresh();
      appToast.success(t("admin.statusUpdated"));
    });
  }

  function handleStatusChange(nextStatus: AdminIssueStatus) {
    if (nextStatus === status) {
      return;
    }

    if (nextStatus === "RESOLVED") {
      setResolutionDialogOpen(true);
      return;
    }

    submitStatusChange(nextStatus);
  }

  function handleResolveSubmit() {
    const trimmedComment = resolutionComment.trim();
    if (!trimmedComment) {
      appToast.error(t("admin.comments.resolveRequired"));
      return;
    }

    submitStatusChange("RESOLVED", {
      resolutionComment: trimmedComment,
      fixedIn: resolutionFixedIn.trim() || undefined,
    });
  }

  function scrollEditFieldIntoView(id: string) {
    if (!isMobile) {
      return;
    }

    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }

  const editFormFields = (
    <>
      <div className={cn("space-y-2", isMobile && "rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm")}>
        <label
          className={cn(
            "text-sm font-medium",
            isMobile && "text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground",
          )}
          htmlFor="issue-title"
        >
          {t("form.issueTitle")}
        </label>
        <Input
          id="issue-title"
          value={draftTitle}
          onFocus={() => scrollEditFieldIntoView("issue-title")}
          onChange={(event) => setDraftTitle(event.target.value)}
          maxLength={200}
          disabled={pending}
          autoFocus={!isMobile}
          className={cn(
            isMobile &&
              "h-11 rounded-xl border-border/70 bg-background/70 text-base font-semibold shadow-none",
          )}
        />
      </div>

      <div className={cn("space-y-2", isMobile && "rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm")}>
        <label
          className={cn(
            "text-sm font-medium",
            isMobile && "text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground",
          )}
          htmlFor="issue-description"
        >
          {t("form.description")}
        </label>
        <textarea
          id="issue-description"
          value={draftDescription}
          onFocus={() => scrollEditFieldIntoView("issue-description")}
          onChange={(event) => setDraftDescription(event.target.value)}
          maxLength={20_000}
          rows={8}
          className={cn(
            issueFormFieldClassName,
            "min-h-44 resize-y py-2",
            isMobile &&
              "min-h-56 rounded-xl border-border/70 bg-background/70 text-base leading-relaxed shadow-none",
          )}
          disabled={pending}
        />
      </div>
    </>
  );

  const editActionButtons = (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn(isMobile && "h-11 flex-1 rounded-xl")}
        onClick={() => handleEditOpenChange(false)}
        disabled={pending}
      >
        {t("form.cancel")}
      </Button>
      <Button
        type="submit"
        className={cn(isMobile && "h-11 flex-1 rounded-xl")}
        disabled={pending || !draftTitle.trim() || !draftDescription.trim()}
      >
        {pending ? t("admin.edit.saving") : t("admin.edit.save")}
      </Button>
    </>
  );

  return (
    <div className={cn("mx-auto min-w-0 w-full space-y-6 pb-8", estimateEditorMaxWidthClass)}>
      <EstimateEditorLayoutStyles />

      <header className="min-w-0 space-y-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 space-y-3">
            <div className="flex min-w-0 items-center gap-3 sm:flex-wrap sm:gap-4">
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-xl border border-primary/15 bg-primary/10",
                "px-3 py-1 font-mono text-base font-bold tabular-nums tracking-tight text-primary sm:text-lg",
              )}
            >
              #{issue.number}
            </span>
            <h1 className="hidden min-w-0 flex-1 text-2xl font-semibold tracking-tight text-foreground sm:block">
              {issueTitle}
            </h1>
            <IssueStatusBadge
              status={status}
              label={t(`status.${status}`)}
              className="ml-1 hidden shrink-0 px-2.5 py-1 text-xs sm:ml-2 sm:inline-flex"
            />
          </div>
          <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-foreground sm:hidden">
            {issueTitle}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <IssueTypeBadge label={t(`type.${issue.type}`)} />
            <IssuePriorityBadge
              priority={issue.priority}
              label={t(`priority.${issue.priority}`)}
            />
          </div>
          <p className="hidden text-sm text-muted-foreground sm:block">
            {t("admin.detail.metaLine", {
              created: formatDateTime(issue.createdAt),
              updated: formatDateTime(issue.updatedAt),
            })}
          </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:hidden">
            <IssueStatusBadge
              status={status}
              label={t(`status.${status}`)}
              className="px-2.5 py-1 text-xs"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="rounded-full border-border/70 bg-background/40"
                  aria-label={t("admin.detail.moreActions")}
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() =>
                    copyText(
                      buildCursorPrompt({
                        ...issue,
                        title: issueTitle,
                        description: issueDescription,
                      }),
                      t("admin.promptCopied"),
                    )
                  }
                >
                  <Copy className="size-4" />
                  {t("admin.copyPrompt")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={openEditDialog}>
                  <Pencil className="size-4" />
                  {t("admin.edit.trigger")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={copyIssueUrl}>
                  <Link2 className="size-4" />
                  {t("admin.copyUrl")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-1.5 text-sm text-muted-foreground sm:hidden">
          <p className="flex w-full min-w-0 items-center gap-2">
            <CalendarPlus className="size-3.5 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0 whitespace-nowrap">
              {t("admin.detail.createdAt")}: {formatDateTime(issue.createdAt)}
            </span>
          </p>
          <p className="flex w-full min-w-0 items-center gap-2">
            <CalendarClock className="size-3.5 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0 whitespace-nowrap">
              {t("admin.detail.updatedAt")}: {formatDateTime(issue.updatedAt)}
            </span>
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className={cn(estimateOutlineButtonClassName, "min-w-0 px-2 sm:px-3")}
            asChild
          >
            <Link href={listHref}>{isMobile ? t("admin.detail.back") : t("admin.detail.backToList")}</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(estimateOutlineButtonClassName, "hidden min-w-0 px-2 sm:inline-flex sm:px-3")}
            onClick={() =>
              copyText(
                buildCursorPrompt({
                  ...issue,
                  title: issueTitle,
                  description: issueDescription,
                }),
                t("admin.promptCopied"),
              )
            }
          >
            <Copy className="size-4" />
            <span className="truncate">{t("admin.copyPrompt")}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(estimateOutlineButtonClassName, "min-w-0 px-2 sm:px-3")}
            onClick={openEditDialog}
          >
            <Pencil className="size-4" />
            <span className="truncate">{t("admin.edit.trigger")}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(estimateOutlineButtonClassName, "hidden min-w-0 px-2 sm:inline-flex sm:px-3")}
            onClick={copyIssueUrl}
          >
            <Link2 className="size-4" />
            <span className="hidden sm:inline">{t("admin.copyUrl")}</span>
          </Button>
        </div>
      </header>

      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <DetailCard icon={AlignLeft} title={t("admin.description")}>
            <DescriptionBlock description={issueDescription} />
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

          <DetailCard icon={MessageSquare} title={t("admin.activity.title")}>
            <div className="flex flex-wrap items-center gap-2 px-4 py-3">
              <span className="text-sm font-medium text-muted-foreground">
                {t("admin.activity.show")}
              </span>
              {(["comments", "history"] as const).map((tab) => (
                <Button
                  key={tab}
                  type="button"
                  size="sm"
                  variant={activePanelTab === tab ? "default" : "outline"}
                  onClick={() => setActivePanelTab(tab)}
                >
                  {t(`admin.activity.tabs.${tab}`)}
                </Button>
              ))}
            </div>
            {activePanelTab === "comments" ? (
              <IssueCommentsPanel
                issueNumber={issue.number}
                locale={locale}
                initialComments={issue.comments}
                currentUserId={currentUser.id}
                currentUserAvatarUrl={currentUser.avatarUrl}
                currentUserAvatarPreset={currentUser.avatarPreset}
              />
            ) : (
              <IssueHistoryPanel initialLogs={issue.activityLogs} />
            )}
          </DetailCard>
        </div>

        <aside className="min-w-0">
          <DetailCard icon={Settings2} title={t("admin.detail.detailsSection")}>
            <div className="px-5 py-3.5">
              <p className="mb-2 text-xs font-medium text-muted-foreground">{t("admin.status")}</p>
              <Select
                value={status}
                onValueChange={(value) => handleStatusChange(value as AdminIssueStatus)}
                disabled={pending}
              >
                <SelectTrigger className={cn(issueFormFieldClassName, "w-full")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">{t("status.OPEN")}</SelectItem>
                  <SelectItem value="ON_HOLD">{t("status.ON_HOLD")}</SelectItem>
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

      <Dialog open={resolutionDialogOpen} onOpenChange={setResolutionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.comments.resolveTitle")}</DialogTitle>
            <DialogDescription>{t("admin.comments.resolveDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="issue-resolution-comment">
                {t("admin.comments.resolveCommentLabel")}
              </label>
              <textarea
                id="issue-resolution-comment"
                value={resolutionComment}
                onChange={(event) => setResolutionComment(event.target.value)}
                maxLength={ISSUE_COMMENT_BODY_MAX_LENGTH}
                rows={5}
                className={cn(issueFormFieldClassName, "min-h-32 resize-y py-2")}
                placeholder={t("admin.comments.resolvePlaceholder")}
                disabled={pending}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="issue-fixed-in">
                {t("admin.comments.fixedInLabel")}
              </label>
              <Input
                id="issue-fixed-in"
                value={resolutionFixedIn}
                onChange={(event) => setResolutionFixedIn(event.target.value)}
                maxLength={200}
                placeholder={t("admin.comments.fixedInPlaceholder")}
                disabled={pending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setResolutionDialogOpen(false)}
              disabled={pending}
            >
              {t("form.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleResolveSubmit}
              disabled={pending || resolutionComment.trim().length === 0}
            >
              {pending ? t("admin.comments.resolving") : t("admin.comments.resolveSubmit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isMobile ? (
        <Sheet open={editDialogOpen} onOpenChange={handleEditOpenChange}>
          <SheetContent
            className="z-[80] h-auto max-h-[min(92dvh,100%)] gap-0 rounded-t-[1.75rem] border-border/70 bg-background/98 p-0 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/92"
            overlayClassName="z-[80] bg-black/65"
            showCloseButton
            style={editSheetStyle}
            onOpenAutoFocus={(event) => event.preventDefault()}
            {...editSheetOutsideHandlers}
          >
            <SheetHeader className="border-b border-border/60 px-5 pt-5 pb-4 text-left">
              <div className="mb-1 flex items-center gap-2">
                <span className="inline-flex rounded-lg border border-primary/15 bg-primary/10 px-2 py-0.5 font-mono text-sm font-bold text-primary">
                  #{issue.number}
                </span>
                <span className="truncate text-sm font-medium text-muted-foreground">
                  {issueTitle}
                </span>
              </div>
              <SheetTitle className="text-xl font-semibold tracking-tight">
                {t("admin.edit.title")}
              </SheetTitle>
              <SheetDescription className="leading-relaxed">
                {t("admin.edit.description")}
              </SheetDescription>
            </SheetHeader>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleIssueDetailsSubmit();
              }}
              className="flex min-h-0 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {editFormFields}
              </div>
              <SheetFooter className="flex-row gap-2 border-t border-border/60 bg-background/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {editActionButtons}
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={editDialogOpen} onOpenChange={handleEditOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.edit.title")}</DialogTitle>
              <DialogDescription>{t("admin.edit.description")}</DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleIssueDetailsSubmit();
              }}
              className="space-y-4"
            >
              {editFormFields}
              <DialogFooter>{editActionButtons}</DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
