"use client";

import { WorkspaceIndustry } from "@prisma/client";
import { FileStack, GitBranch, Loader2, MoreHorizontal, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";

import { WorkspaceMemberStack } from "@/components/layout/app-sidebar/workspace-member-stack";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/features/attachments/lib/format-bytes";
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
import { Label } from "@/components/ui/label";
import { ThemedWorkspaceIcon } from "@/features/workspaces/components/themed-workspace-icon";
import { WorkspaceBillingReportPanel } from "@/features/workspaces/components/workspace-billing-report-panel";
import type { AdminWorkspaceRow } from "@/features/workspaces/server/admin-workspaces";
import {
  adminArchiveWorkspaceAction,
  adminGetWorkspaceBillingReportAction,
  adminInviteToWorkspaceAction,
  adminUpdateWorkspaceAction,
} from "@/features/workspaces/server/admin-actions";
import type { WorkspaceBillingReport } from "@/server/billing/dev-toolkit/report";
import type { Locale } from "@/lib/locale";
import type { PaginatedResult } from "@/lib/pagination";
import { usePaginationUrl } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import type { WorkspaceEffectiveStatus } from "@/server/permissions/domain";

type DialogMode = "view" | "rename" | "delete" | "invite" | null;
type AdminWorkspaceListView = "general" | "billing";

function formatLimit(used: number, limit: number | null): string {
  return limit === null ? `${used} / ∞` : `${used} / ${limit}`;
}

function formatSeats(used: number, reserved: number, limit: number | null): string {
  const total = used + reserved;
  return limit === null ? `${total} / ∞` : `${total} / ${limit}`;
}

function formatStorage(used: number, limit: number): string {
  return `${formatBytes(used)} / ${formatBytes(limit)}`;
}

function formatRelativeAgo(locale: string, value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const absSec = Math.abs(diffSec);

  if (absSec < 60) {
    return rtf.format(diffSec, "second");
  }

  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, "minute");
  }

  const diffHour = Math.round(diffSec / 3600);
  if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, "hour");
  }

  const diffDay = Math.round(diffSec / 86400);
  if (Math.abs(diffDay) < 30) {
    return rtf.format(diffDay, "day");
  }

  const diffMonth = Math.round(diffSec / (86400 * 30));
  if (Math.abs(diffMonth) < 12) {
    return rtf.format(diffMonth, "month");
  }

  const diffYear = Math.round(diffSec / (86400 * 365));
  return rtf.format(diffYear, "year");
}

function StatColumn({
  icon: Icon,
  label,
  count,
  className,
}: {
  icon: LucideIcon;
  label: string;
  count: number;
  className?: string;
}) {
  return (
    <div className={cn("min-w-[108px]", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <Icon className="size-4 shrink-0 text-muted-foreground/80" strokeWidth={1.75} />
        <span className="text-base font-semibold tabular-nums leading-none">{count}</span>
      </div>
    </div>
  );
}

function IndustryColumn({
  label,
  industryLabel,
  className,
}: {
  label: string;
  industryLabel: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-[108px]", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1.5">
        <Badge
          variant="secondary"
          className="max-w-[140px] truncate rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300"
          title={industryLabel}
        >
          {industryLabel}
        </Badge>
      </div>
    </div>
  );
}

function PlanColumn({
  label,
  planLabel,
  status,
  statusLabel,
  className,
}: {
  label: string;
  planLabel: string;
  status: WorkspaceEffectiveStatus;
  statusLabel: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-[140px]", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold leading-none">{planLabel}</span>
        <EffectiveStatusBadge status={status} label={statusLabel} />
      </div>
    </div>
  );
}

function ValueColumn({
  label,
  value,
  className,
  mono,
}: {
  label: string;
  value: string;
  className?: string;
  mono?: boolean;
}) {
  return (
    <div className={cn("min-w-[108px]", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-sm font-semibold tabular-nums leading-none",
          mono && "font-mono text-xs font-medium",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function WorkspaceActionsMenu({
  workspace,
  onOpenDialog,
}: {
  workspace: AdminWorkspaceRow;
  onOpenDialog: (mode: DialogMode, workspace: AdminWorkspaceRow) => void;
}) {
  const t = useTranslations("admin.workspaces");

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 rounded-lg text-muted-foreground"
          aria-label={t("actions.menu")}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => onOpenDialog("view", workspace)}>
          {t("actions.view")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onOpenDialog("rename", workspace)}>
          {t("actions.rename")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onOpenDialog("invite", workspace)}>
          {t("actions.invite")}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => onOpenDialog("delete", workspace)}
        >
          {t("actions.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EffectiveStatusBadge({
  status,
  label,
}: {
  status: WorkspaceEffectiveStatus;
  label: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-md px-2 py-0.5 text-[11px] font-medium",
        status === "ACTIVE" &&
          "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
        (status === "PAST_DUE" || status === "GRACE_PERIOD") &&
          "border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300",
        (status === "EXPIRED" ||
          status === "ARCHIVED" ||
          status === "SUSPENDED" ||
          status === "PENDING_DELETION") &&
          "border border-border/60 bg-muted/50 text-muted-foreground",
        status === "INCOMPLETE" &&
          "border border-violet-500/20 bg-violet-500/10 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300",
      )}
    >
      {label}
    </Badge>
  );
}

function AdminWorkspaceListRow({
  workspace,
  onOpenDialog,
}: {
  workspace: AdminWorkspaceRow;
  onOpenDialog: (mode: DialogMode, workspace: AdminWorkspaceRow) => void;
}) {
  const t = useTranslations("admin.workspaces");
  const tIndustries = useTranslations("workspaces.industries");
  const locale = useLocale();
  const ownerLabel = workspace.owner.name ?? workspace.owner.email;
  const createdAgo = formatRelativeAgo(locale, workspace.createdAt);
  const updatedAgo = formatRelativeAgo(locale, workspace.updatedAt);
  const industryLabel =
    workspace.industry === WorkspaceIndustry.OTHER && workspace.industryOtherText
      ? workspace.industryOtherText
      : tIndustries(workspace.industry);

  return (
    <div className="flex items-center gap-4 px-4 py-4 sm:gap-6">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <ThemedWorkspaceIcon name={workspace.name} theme={workspace.appearanceTheme} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-tight">{workspace.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {t("row.meta", {
              owner: ownerLabel,
              created: createdAgo,
              updated: updatedAgo,
            })}
          </p>
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-8 md:flex">
        <IndustryColumn label={t("stats.industry")} industryLabel={industryLabel} />
        <PlanColumn
          label={t("stats.plan")}
          planLabel={t(`plan.${workspace.plan}`)}
          status={workspace.effectiveStatus}
          statusLabel={t(`effectiveStatus.${workspace.effectiveStatus}`)}
        />
        <StatColumn
          icon={FileStack}
          label={t("stats.estimateRequests")}
          count={workspace.estimateRequestCount}
        />
        <StatColumn
          icon={GitBranch}
          label={t("stats.estimates")}
          count={workspace.estimateCount}
        />
      </div>

      <div className="hidden shrink-0 flex-col gap-1.5 sm:flex sm:min-w-[148px]">
        <p className="text-xs text-muted-foreground">
          {t("row.membersHeading", { count: workspace.memberCount })}
        </p>
        <WorkspaceMemberStack
          previews={workspace.memberPreviews}
          totalCount={workspace.memberCount}
          size="sm"
          surface="panel"
          onInviteClick={() => onOpenDialog("invite", workspace)}
        />
      </div>

      <WorkspaceActionsMenu workspace={workspace} onOpenDialog={onOpenDialog} />
    </div>
  );
}

function AdminWorkspaceBillingListRow({
  workspace,
  onOpenDialog,
}: {
  workspace: AdminWorkspaceRow;
  onOpenDialog: (mode: DialogMode, workspace: AdminWorkspaceRow) => void;
}) {
  const t = useTranslations("admin.workspaces");
  const ownerLabel = workspace.owner.name ?? workspace.owner.email;
  const { billing } = workspace;

  return (
    <div className="flex items-center gap-4 px-4 py-4 sm:gap-6">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <ThemedWorkspaceIcon name={workspace.name} theme={workspace.appearanceTheme} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-tight">{workspace.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{ownerLabel}</p>
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-6 md:flex">
        <ValueColumn label={t("billingColumns.plan")} value={t(`plan.${workspace.plan}`)} />
        <ValueColumn
          label={t("billingColumns.planVersion")}
          value={billing.planVersion ?? t("billingColumns.noVersion")}
          mono
        />
        <div className="min-w-[108px]">
          <p className="text-xs text-muted-foreground">{t("billingColumns.status")}</p>
          <div className="mt-1.5">
            <EffectiveStatusBadge
              status={workspace.effectiveStatus}
              label={t(`effectiveStatus.${workspace.effectiveStatus}`)}
            />
          </div>
        </div>
        <ValueColumn
          label={t("billingColumns.aiUsage")}
          value={formatLimit(billing.aiUsageUsed, billing.aiUsageLimit)}
        />
        <ValueColumn
          label={t("billingColumns.estimateUsage")}
          value={formatLimit(billing.estimateUsageUsed, billing.estimateUsageLimit)}
        />
        <ValueColumn
          label={t("billingColumns.seats")}
          value={formatSeats(billing.seatsUsed, billing.seatsReserved, billing.seatsLimit)}
        />
        <ValueColumn
          label={t("billingColumns.storage")}
          value={formatStorage(billing.storageUsedBytes, billing.storageLimitBytes)}
          className="min-w-[140px]"
        />
      </div>

      <WorkspaceActionsMenu workspace={workspace} onOpenDialog={onOpenDialog} />
    </div>
  );
}

function AdminWorkspaceBillingListHeader() {
  const t = useTranslations("admin.workspaces");

  return (
    <div className="hidden border-b border-border/60 px-4 py-2.5 md:block">
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="min-w-0 flex-1 text-xs font-medium text-muted-foreground">
          {t("billingColumns.workspace")}
        </div>
        <div className="flex shrink-0 items-center gap-6">
          <span className="min-w-[108px] text-xs font-medium text-muted-foreground">
            {t("billingColumns.plan")}
          </span>
          <span className="min-w-[108px] text-xs font-medium text-muted-foreground">
            {t("billingColumns.planVersion")}
          </span>
          <span className="min-w-[108px] text-xs font-medium text-muted-foreground">
            {t("billingColumns.status")}
          </span>
          <span className="min-w-[108px] text-xs font-medium text-muted-foreground">
            {t("billingColumns.aiUsage")}
          </span>
          <span className="min-w-[108px] text-xs font-medium text-muted-foreground">
            {t("billingColumns.estimateUsage")}
          </span>
          <span className="min-w-[108px] text-xs font-medium text-muted-foreground">
            {t("billingColumns.seats")}
          </span>
          <span className="min-w-[140px] text-xs font-medium text-muted-foreground">
            {t("billingColumns.storage")}
          </span>
        </div>
        <div className="size-8 shrink-0" aria-hidden />
      </div>
    </div>
  );
}

export function AdminWorkspacesPanel({
  locale,
  initialData,
  initialSearch,
}: {
  locale: Locale;
  initialData: PaginatedResult<AdminWorkspaceRow>;
  initialSearch: string;
}) {
  const t = useTranslations("admin.workspaces");
  const router = useRouter();
  const paginationUrl = usePaginationUrl();
  const [search, setSearch] = useState(() => initialSearch);
  const [listView, setListView] = useState<AdminWorkspaceListView>("general");
  const [data, setData] = useState(() => initialData);
  const [activeWorkspace, setActiveWorkspace] = useState<AdminWorkspaceRow | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [billingReport, setBillingReport] = useState<WorkspaceBillingReport | null>(null);
  const [isBillingReportLoading, setIsBillingReportLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const setSearchInUrlRef = useRef(paginationUrl.setSearch);
  setSearchInUrlRef.current = paginationUrl.setSearch;

  const syncedSearchRef = useRef(initialSearch);

  useEffect(() => {
    syncedSearchRef.current = initialSearch;
  }, [initialSearch]);

  useEffect(() => {
    if (search === syncedSearchRef.current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      syncedSearchRef.current = search.trim();
      setSearchInUrlRef.current(search);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search]);

  function openDialog(mode: DialogMode, workspace: AdminWorkspaceRow) {
    setActiveWorkspace(workspace);
    setDialogMode(mode);
    setError(null);
    setName(workspace.name);
    setSlug(workspace.slug);
    setEmail("");

    if (mode === "view") {
      setBillingReport(null);
      setIsBillingReportLoading(true);
      startTransition(async () => {
        const result = await adminGetWorkspaceBillingReportAction(workspace.slug, locale);

        setIsBillingReportLoading(false);

        if (!result.success) {
          setError(result.error);
          return;
        }

        setBillingReport(result.data);
      });
    }
  }

  function closeDialog() {
    setDialogMode(null);
    setActiveWorkspace(null);
    setError(null);
    setBillingReport(null);
    setIsBillingReportLoading(false);
  }

  function handleRename() {
    if (!activeWorkspace) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await adminUpdateWorkspaceAction(
        activeWorkspace.id,
        { name, slug },
        locale,
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      setData((current) => ({
        ...current,
        items: current.items.map((row) =>
          row.id === activeWorkspace.id ? { ...row, name: name.trim(), slug } : row,
        ),
      }));
      closeDialog();
      router.refresh();
    });
  }

  function handleDelete() {
    if (!activeWorkspace) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await adminArchiveWorkspaceAction(activeWorkspace.id, locale);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setData((current) => ({
        ...current,
        items: current.items.filter((row) => row.id !== activeWorkspace.id),
      }));
      closeDialog();
      router.refresh();
    });
  }

  function handleInvite() {
    if (!activeWorkspace) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await adminInviteToWorkspaceAction(activeWorkspace.id, email, locale);

      if (!result.success) {
        setError(result.error);
        return;
      }

      closeDialog();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-10 rounded-xl pl-9"
            aria-label={t("searchPlaceholder")}
          />
        </div>

        <div
          className="inline-flex shrink-0 rounded-xl border border-border/60 bg-muted/30 p-1"
          role="group"
          aria-label={t("views.general")}
        >
          <Button
            type="button"
            size="sm"
            variant={listView === "general" ? "secondary" : "ghost"}
            className="rounded-lg px-3"
            onClick={() => setListView("general")}
          >
            {t("views.general")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={listView === "billing" ? "secondary" : "ghost"}
            className="rounded-lg px-3"
            onClick={() => setListView("billing")}
          >
            {t("views.billing")}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">{t("bar.allWorkspaces")}</span>
          <Button asChild size="sm" className="rounded-lg px-4">
            <Link href={`/${locale}/dashboard/workspaces/new`}>{t("bar.addWorkspace")}</Link>
          </Button>
        </div>

        {data.items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <>
            {listView === "billing" ? <AdminWorkspaceBillingListHeader /> : null}
            <div className="divide-y divide-border/60">
              {data.items.map((workspace) =>
                listView === "billing" ? (
                  <AdminWorkspaceBillingListRow
                    key={workspace.id}
                    workspace={workspace}
                    onOpenDialog={openDialog}
                  />
                ) : (
                  <AdminWorkspaceListRow
                    key={workspace.id}
                    workspace={workspace}
                    onOpenDialog={openDialog}
                  />
                ),
              )}
            </div>
          </>
        )}
      </div>

      <PaginationControls
        page={data.page}
        pageSize={data.pageSize}
        totalCount={data.totalCount}
        totalPages={data.totalPages}
        hasPreviousPage={data.hasPreviousPage}
        hasNextPage={data.hasNextPage}
        onPageChange={paginationUrl.setPage}
        onPageSizeChange={paginationUrl.setPageSize}
        isLoading={isPending}
      />

      <Dialog open={dialogMode === "view"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent showCloseButton className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("preview.title", { name: activeWorkspace?.name ?? "" })}</DialogTitle>
            <DialogDescription>{t("preview.description")}</DialogDescription>
          </DialogHeader>

          {isBillingReportLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              <span>{t("preview.loading")}</span>
            </div>
          ) : billingReport ? (
            <WorkspaceBillingReportPanel
              report={billingReport}
              locale={locale}
              labels={{
                sections: {
                  overview: t("preview.sections.overview"),
                  subscription: t("preview.sections.subscription"),
                  features: t("preview.sections.features"),
                  usage: t("preview.sections.usage"),
                  stripe: t("preview.sections.stripe"),
                },
                fields: {
                  slug: t("preview.fields.slug"),
                  owner: t("preview.fields.owner"),
                  plan: t("preview.fields.plan"),
                  planVersion: t("preview.fields.planVersion"),
                  subscriptionStatus: t("preview.fields.subscriptionStatus"),
                  effectiveStatus: t("preview.fields.effectiveStatus"),
                  provisioningStatus: t("preview.fields.provisioningStatus"),
                  isActiveFree: t("preview.fields.isActiveFree"),
                  aiUsage: t("preview.fields.aiUsage"),
                  estimateUsage: t("preview.fields.estimateUsage"),
                  seats: t("preview.fields.seats"),
                  storage: t("preview.fields.storage"),
                  stripeCustomerId: t("preview.fields.stripeCustomerId"),
                  stripeSubscriptionId: t("preview.fields.stripeSubscriptionId"),
                  cancelAtPeriodEnd: t("preview.fields.cancelAtPeriodEnd"),
                  currentPeriodEnd: t("preview.fields.currentPeriodEnd"),
                  graceEndsAt: t("preview.fields.graceEndsAt"),
                },
              }}
            />
          ) : null}

          {error ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeDialog}>
              {t("actions.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogMode === "rename"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent showCloseButton className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("rename.title")}</DialogTitle>
            <DialogDescription>{t("rename.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-workspace-name">{t("rename.nameLabel")}</Label>
              <Input
                id="admin-workspace-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-workspace-slug">{t("rename.slugLabel")}</Label>
              <Input
                id="admin-workspace-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                disabled={isPending}
                className="font-mono text-sm"
              />
            </div>
            {error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" disabled={isPending} onClick={closeDialog}>
              {t("actions.cancel")}
            </Button>
            <Button type="button" disabled={isPending} onClick={handleRename}>
              {isPending ? t("actions.saving") : t("actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogMode === "delete"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent showCloseButton className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("delete.title", { name: activeWorkspace?.name ?? "" })}</DialogTitle>
            <DialogDescription>{t("delete.description")}</DialogDescription>
          </DialogHeader>
          {error ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" disabled={isPending} onClick={closeDialog}>
              {t("actions.cancel")}
            </Button>
            <Button type="button" variant="destructive" disabled={isPending} onClick={handleDelete}>
              {isPending ? t("actions.deleting") : t("actions.deleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogMode === "invite"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent showCloseButton className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("invite.title", { name: activeWorkspace?.name ?? "" })}</DialogTitle>
            <DialogDescription>{t("invite.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="admin-workspace-invite-email">{t("invite.emailLabel")}</Label>
            <Input
              id="admin-workspace-invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("invite.emailPlaceholder")}
              disabled={isPending}
            />
            {error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" disabled={isPending} onClick={closeDialog}>
              {t("actions.cancel")}
            </Button>
            <Button type="button" disabled={isPending} onClick={handleInvite}>
              {isPending ? t("actions.inviting") : t("actions.inviteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
