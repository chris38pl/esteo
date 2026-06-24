"use client";

import type { PlatformRole } from "@prisma/client";
import { Building2, FileStack, GitBranch, MoreHorizontal, Search } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import { appToast } from "@/components/ui/app-toast";

import { UserAvatar } from "@/components/avatars/user-avatar";
import { isAvatarPreset } from "@/lib/avatars/user-avatar-presets";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { adminSetUserPlatformRoleAction } from "@/features/users/server/admin-actions";
import type { AdminUserRow } from "@/features/users/server/admin-users";
import type { Locale } from "@/lib/locale";
import type { PaginatedResult } from "@/lib/pagination";
import { usePaginationUrl } from "@/lib/pagination";
import { cn } from "@/lib/utils";

function formatDateTime(locale: string, value: Date | string | null): string {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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
    <div className={cn("min-w-[96px]", className)}>
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
    <div className={cn("min-w-[148px]", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-sm font-medium tabular-nums leading-tight">
        {formatDateTime(locale, value)}
      </p>
    </div>
  );
}

function PlanBadge({ label }: { label: string }) {
  return (
    <Badge
      variant="secondary"
      className="rounded-md border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300"
    >
      {label}
    </Badge>
  );
}

function PlatformRoleBadge({ role }: { role: PlatformRole }) {
  const t = useTranslations("admin.users.platformRole");

  if (role === "NONE") {
    return null;
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-md px-2 py-0.5 text-[11px] font-medium",
        role === "PLATFORM_ADMIN" &&
          "border border-sky-500/20 bg-sky-500/10 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300",
        role === "QA_TESTER" &&
          "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
      )}
    >
      {t(role)}
    </Badge>
  );
}

function UserActionsMenu({
  user,
  viewerUserId,
  onSetQaRole,
  isPending,
}: {
  user: AdminUserRow;
  viewerUserId: string;
  onSetQaRole: (userId: string, role: "NONE" | "QA_TESTER") => void;
  isPending: boolean;
}) {
  const t = useTranslations("admin.users.actions");

  const canManageRole =
    user.id !== viewerUserId && user.platformRole !== "PLATFORM_ADMIN";

  if (!canManageRole) {
    return null;
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 rounded-lg text-muted-foreground"
          aria-label={t("menu")}
          disabled={isPending}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {user.platformRole === "QA_TESTER" ? (
          <DropdownMenuItem disabled={isPending} onSelect={() => onSetQaRole(user.id, "NONE")}>
            {t("removeQaRole")}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            disabled={isPending}
            onSelect={() => onSetQaRole(user.id, "QA_TESTER")}
          >
            {t("setQaRole")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AdminUserListRow({
  user,
  viewerUserId,
  onSetQaRole,
  isPending,
}: {
  user: AdminUserRow;
  viewerUserId: string;
  onSetQaRole: (userId: string, role: "NONE" | "QA_TESTER") => void;
  isPending: boolean;
}) {
  const t = useTranslations("admin.users");
  const locale = useLocale();
  const displayName = user.name?.trim() || user.email;

  return (
    <div className="flex items-center gap-4 px-4 py-4 sm:gap-6">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <UserAvatar
          imageUrl={user.avatarUrl}
          avatarPreset={isAvatarPreset(user.avatarPreset) ? user.avatarPreset : null}
          size={40}
          className="ring-0"
        />
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-semibold leading-tight">{displayName}</p>
            <PlatformRoleBadge role={user.platformRole} />
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-8 md:flex">
        <div className="min-w-[88px]">
          <p className="text-xs text-muted-foreground">{t("stats.provider")}</p>
          <p className="mt-1.5 text-sm font-medium">{t(`provider.${user.provider}`)}</p>
        </div>
        <div className="min-w-[72px]">
          <p className="text-xs text-muted-foreground">{t("stats.plan")}</p>
          <div className="mt-1.5">
            <PlanBadge label={t(`plan.${user.plan}`)} />
          </div>
        </div>
        <StatColumn
          icon={Building2}
          label={t("stats.workspaces")}
          count={user.workspaceCount}
        />
        <StatColumn
          icon={FileStack}
          label={t("stats.estimateRequests")}
          count={user.estimateRequestCount}
        />
        <StatColumn
          icon={GitBranch}
          label={t("stats.estimates")}
          count={user.estimateCount}
        />
        <DateColumn label={t("stats.created")} value={user.createdAt} locale={locale} />
        <DateColumn label={t("stats.lastActive")} value={user.lastActiveAt} locale={locale} />
      </div>

      <UserActionsMenu
        user={user}
        viewerUserId={viewerUserId}
        onSetQaRole={onSetQaRole}
        isPending={isPending}
      />
    </div>
  );
}

export function AdminUsersPanel({
  locale,
  viewerUserId,
  initialData,
  initialSearch,
}: {
  locale: Locale;
  viewerUserId: string;
  initialData: PaginatedResult<AdminUserRow>;
  initialSearch: string;
}) {
  const t = useTranslations("admin.users");
  const router = useRouter();
  const paginationUrl = usePaginationUrl();
  const [search, setSearch] = useState(() => initialSearch);
  const [data, setData] = useState(() => initialData);
  const [isPending, startTransition] = useTransition();

  const setSearchInUrl = paginationUrl.setSearch;
  const syncedSearchRef = useRef(initialSearch);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    syncedSearchRef.current = initialSearch;
  }, [initialSearch]);

  useEffect(() => {
    if (search === syncedSearchRef.current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      syncedSearchRef.current = search.trim();
      setSearchInUrl(search);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search, setSearchInUrl]);

  function handleSetQaRole(userId: string, role: "NONE" | "QA_TESTER") {
    startTransition(async () => {
      const result = await adminSetUserPlatformRoleAction(userId, role, locale);

      if (!result.success) {
        appToast.error(result.error);
        return;
      }

      setData((current) => ({
        ...current,
        items: current.items.map((row) =>
          row.id === userId ? { ...row, platformRole: result.data.platformRole } : row,
        ),
      }));
      appToast.success(role === "QA_TESTER" ? t("actions.qaRoleGranted") : t("actions.qaRoleRemoved"));
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
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

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">{t("bar.allUsers")}</span>
        </div>

        {data.items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="divide-y divide-border/60">
            {data.items.map((user) => (
              <AdminUserListRow
                key={user.id}
                user={user}
                viewerUserId={viewerUserId}
                onSetQaRole={handleSetQaRole}
                isPending={isPending}
              />
            ))}
          </div>
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
      />
    </div>
  );
}
