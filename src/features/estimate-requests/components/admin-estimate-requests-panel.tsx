"use client";

import type { EstimateRequestStatus } from "@prisma/client";
import { MoreHorizontal, Paperclip, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";

import { PaginationControls } from "@/components/shared/pagination-controls";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AdminEstimateRequestRow } from "@/features/estimate-requests/server/admin-estimate-requests";
import {
  adminArchiveEstimateRequestAction,
  adminRestoreEstimateRequestAction,
} from "@/features/estimate-requests/server/admin-actions";
import type { Locale } from "@/lib/locale";
import type { PaginatedResult } from "@/lib/pagination";
import { usePaginationUrl } from "@/lib/pagination";
import { cn } from "@/lib/utils";

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

function formatDateTime(locale: string, value: Date | string | null): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StatusBadge({
  status,
  label,
}: {
  status: EstimateRequestStatus;
  label: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-md border px-2 py-0.5 text-[11px] font-medium",
        STATUS_STYLES[status],
      )}
    >
      {label}
    </Badge>
  );
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
    <div className={cn("min-w-[80px]", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <Icon className="size-4 shrink-0 text-muted-foreground/80" strokeWidth={1.75} />
        <span className="text-base font-semibold tabular-nums leading-none">{count}</span>
      </div>
    </div>
  );
}

function DateColumn({
  label,
  value,
  locale,
  className,
}: {
  label: string;
  value: Date | string | null;
  locale: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-[140px]", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1.5 whitespace-nowrap text-sm font-medium tabular-nums leading-tight">
        {formatDateTime(locale, value)}
      </p>
    </div>
  );
}

function AdminEstimateRequestListRow({
  request,
  detailHref,
  locale,
  onDelete,
  onRestore,
  isPending,
}: {
  request: AdminEstimateRequestRow;
  detailHref: string;
  locale: string;
  onDelete: (request: AdminEstimateRequestRow) => void;
  onRestore: (request: AdminEstimateRequestRow) => void;
  isPending: boolean;
}) {
  const t = useTranslations("admin.estimateRequests");
  const isDeleted = request.deletedAt !== null;

  const displayName = request.customerFullName ?? request.customerEmail ?? "—";
  const subLabel =
    request.customerFullName && request.customerEmail ? request.customerEmail : null;

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-6",
        isDeleted && "bg-muted/20",
      )}
    >
      {/* Primary: request number + customer identity */}
      <div className="flex min-w-0 flex-1 gap-3.5 md:min-w-[220px] lg:min-w-[260px] max-w-[300px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {request.requestNumber ? (
              <span className="whitespace-nowrap font-mono text-xs font-semibold text-sky-700 dark:text-sky-300">
                {request.requestNumber}
              </span>
            ) : (
              <span className="font-mono text-xs text-muted-foreground/50">—</span>
            )}
            {isDeleted ? (
              <Badge
                variant="secondary"
                className="rounded-md border border-destructive/20 bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive"
              >
                {t("deleted.badge")}
              </Badge>
            ) : null}
            <div className="md:hidden">
              <StatusBadge status={request.status} label={t(`status.${request.status}`)} />
            </div>
          </div>
          <p className="mt-1 truncate text-[15px] font-semibold leading-tight">{displayName}</p>
          {subLabel ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{subLabel}</p>
          ) : null}

          {/* Mobile meta row (card-like) */}
          <div className="mt-2 flex items-center gap-3 overflow-hidden text-xs text-muted-foreground md:hidden">
            <span className="min-w-0 truncate">{request.workspaceName}</span>
            <span aria-hidden className="shrink-0 text-muted-foreground/40">
              •
            </span>
            <span className="shrink-0 tabular-nums">{formatDateTime(locale, request.createdAt)}</span>
            <span aria-hidden className="shrink-0 text-muted-foreground/40">
              •
            </span>
            <span className="shrink-0 inline-flex items-center gap-1 tabular-nums">
              <Paperclip className="size-3.5" />
              {request.attachmentCount}
            </span>
            {request.city ? (
              <>
                <span aria-hidden className="shrink-0 text-muted-foreground/40">
                  •
                </span>
                <span className="min-w-0 truncate">{request.city}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Stats columns (hidden on small screens) */}
      <div className="hidden shrink-0 items-center gap-8 md:flex">
        <div className="min-w-[120px]">
          <p className="text-xs text-muted-foreground">{t("stats.workspace")}</p>
          <p className="mt-1.5 max-w-[120px] truncate text-sm font-medium">
            {request.workspaceName}
          </p>
        </div>
        <div className="hidden min-w-[88px] [@media(min-width:1150px)]:block">
          <p className="text-xs text-muted-foreground">{t("stats.city")}</p>
          <p className="mt-1.5 text-sm font-medium">{request.city ?? "—"}</p>
        </div>
        <div className="hidden min-w-[96px] [@media(min-width:880px)]:block">
          <p className="text-xs text-muted-foreground">{t("stats.status")}</p>
          <div className="mt-1.5">
            <StatusBadge status={request.status} label={t(`status.${request.status}`)} />
          </div>
        </div>
        <StatColumn
          icon={Paperclip}
          label={t("stats.attachments")}
          count={request.attachmentCount}
          className="hidden [@media(min-width:1000px)]:block"
        />
        <DateColumn label={t("stats.created")} value={request.createdAt} locale={locale} />
      </div>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 size-8 shrink-0 rounded-lg text-muted-foreground sm:static sm:self-auto"
            aria-label={t("actions.menu")}
            disabled={isPending}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href={detailHref}>{t("actions.view")}</Link>
          </DropdownMenuItem>
          {isDeleted ? (
            <DropdownMenuItem onSelect={() => onRestore(request)}>
              {t("actions.restore")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(request)}>
              {t("actions.delete")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

type DialogMode = "delete" | "restore" | null;

export function AdminEstimateRequestsPanel({
  locale,
  initialData,
  initialSearch,
  initialShowDeleted,
}: {
  locale: Locale;
  initialData: PaginatedResult<AdminEstimateRequestRow>;
  initialSearch: string;
  initialShowDeleted: boolean;
}) {
  const t = useTranslations("admin.estimateRequests");
  const uiLocale = useLocale();
  const paginationUrl = usePaginationUrl();
  const [search, setSearch] = useState(() => initialSearch);
  const [showDeleted, setShowDeleted] = useState(() => initialShowDeleted);
  const [data, setData] = useState(() => initialData);
  const [activeRequest, setActiveRequest] = useState<AdminEstimateRequestRow | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const setSearchInUrl = paginationUrl.setSearch;
  const updateQuery = paginationUrl.updateQuery;
  const syncedSearchRef = useRef(initialSearch);
  const syncedShowDeletedRef = useRef(initialShowDeleted);

  useEffect(() => {
    syncedSearchRef.current = initialSearch;
    syncedShowDeletedRef.current = initialShowDeleted;
    setData(initialData);
    setShowDeleted(initialShowDeleted);
  }, [initialSearch, initialShowDeleted, initialData]);

  useEffect(() => {
    if (search === syncedSearchRef.current) return;

    const timeout = window.setTimeout(() => {
      syncedSearchRef.current = search.trim();
      startTransition(() => {
        setSearchInUrl(search);
      });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search, setSearchInUrl]);

  function openDeleteDialog(request: AdminEstimateRequestRow) {
    setActiveRequest(request);
    setDialogMode("delete");
    setError(null);
  }

  function openRestoreDialog(request: AdminEstimateRequestRow) {
    setActiveRequest(request);
    setDialogMode("restore");
    setError(null);
  }

  function closeDialog() {
    setActiveRequest(null);
    setDialogMode(null);
    setError(null);
  }

  function handleShowDeletedChange(checked: boolean) {
    setShowDeleted(checked);
    startTransition(() => {
      updateQuery({
        page: "1",
        showDeleted: checked ? "1" : null,
      });
    });
  }

  function handleDelete() {
    if (!activeRequest) return;

    setError(null);
    startTransition(async () => {
      const result = await adminArchiveEstimateRequestAction(activeRequest.id, locale);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setData((current) => ({
        ...current,
        items: showDeleted
          ? current.items.map((row) =>
              row.id === activeRequest.id ? { ...row, deletedAt: new Date() } : row,
            )
          : current.items.filter((row) => row.id !== activeRequest.id),
        totalCount: showDeleted ? current.totalCount : Math.max(0, current.totalCount - 1),
      }));

      closeDialog();
    });
  }

  function handleRestore() {
    if (!activeRequest) return;

    setError(null);
    startTransition(async () => {
      const result = await adminRestoreEstimateRequestAction(activeRequest.id, locale);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setData((current) => ({
        ...current,
        items: current.items.map((row) =>
          row.id === activeRequest.id ? { ...row, deletedAt: null } : row,
        ),
      }));

      closeDialog();
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-10 rounded-xl pl-9"
            aria-label={t("searchPlaceholder")}
          />
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2">
          <Switch
            id="admin-show-deleted-requests"
            checked={showDeleted}
            disabled={isPending}
            onCheckedChange={handleShowDeletedChange}
          />
          <Label htmlFor="admin-show-deleted-requests" className="cursor-pointer text-sm font-medium">
            {t("bar.showDeleted")}
          </Label>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card md:max-w-5xl">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">{t("bar.allRequests")}</span>
          <span className="text-xs tabular-nums text-muted-foreground">{data.totalCount}</span>
        </div>

        {data.items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="divide-y divide-border/60">
            {data.items.map((request) => (
              <AdminEstimateRequestListRow
                key={request.id}
                request={request}
                detailHref={`/${locale}/dashboard/admin/estimate-requests/${request.id}`}
                locale={uiLocale}
                onDelete={openDeleteDialog}
                onRestore={openRestoreDialog}
                isPending={isPending}
              />
            ))}
          </div>
        )}
      </div>

      <div className="md:max-w-5xl">
        <PaginationControls
          page={data.page}
          pageSize={data.pageSize}
          totalCount={data.totalCount}
          totalPages={data.totalPages}
          hasPreviousPage={data.hasPreviousPage}
          hasNextPage={data.hasNextPage}
          onPageChange={paginationUrl.setPage}
          onPageSizeChange={paginationUrl.setPageSize}
        />
      </div>

      <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent showCloseButton className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "restore"
                ? t("restore.title", {
                    requestNumber: activeRequest?.requestNumber ?? activeRequest?.id ?? "",
                  })
                : t("delete.title", {
                    requestNumber: activeRequest?.requestNumber ?? activeRequest?.id ?? "",
                  })}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "restore" ? t("restore.description") : t("delete.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" disabled={isPending} onClick={closeDialog}>
              {t("actions.cancel")}
            </Button>
            {dialogMode === "restore" ? (
              <Button
                type="button"
                disabled={!activeRequest || isPending}
                onClick={handleRestore}
              >
                {isPending ? t("actions.restoring") : t("actions.restoreConfirm")}
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                disabled={!activeRequest || isPending}
                onClick={handleDelete}
              >
                {isPending ? t("actions.deleting") : t("actions.deleteConfirm")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
