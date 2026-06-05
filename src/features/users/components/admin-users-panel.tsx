"use client";

import type { SubscriptionPlan } from "@prisma/client";
import { Building2, FileStack, GitBranch, MoreHorizontal, Search } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";

import { UserAvatar } from "@/components/avatars/user-avatar";
import { isAvatarPreset } from "@/lib/avatars/user-avatar-presets";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { adminSetUserPlanAction } from "@/features/users/server/admin-actions";
import type { AdminUserRow } from "@/features/users/server/admin-users";
import type { Locale } from "@/lib/locale";
import type { PaginatedResult } from "@/lib/pagination";
import { usePaginationUrl } from "@/lib/pagination";
import { cn } from "@/lib/utils";

const PLANS: SubscriptionPlan[] = ["FREE", "PRO", "BUSINESS"];

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

function AdminUserListRow({
  user,
  onSetPlan,
  isPending,
}: {
  user: AdminUserRow;
  onSetPlan: (userId: string, plan: SubscriptionPlan) => void;
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
          <p className="truncate text-[15px] font-semibold leading-tight">{displayName}</p>
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

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-lg text-muted-foreground"
            aria-label={t("actions.menu")}
            disabled={isPending}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>{t("actions.setPlan")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {PLANS.map((plan) => (
            <DropdownMenuItem
              key={plan}
              disabled={isPending || user.plan === plan}
              onSelect={() => onSetPlan(user.id, plan)}
            >
              {t(`plan.${plan}`)}
              {user.plan === plan ? ` (${t("actions.currentPlan")})` : ""}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function AdminUsersPanel({
  locale,
  initialData,
  initialSearch,
}: {
  locale: Locale;
  initialData: PaginatedResult<AdminUserRow>;
  initialSearch: string;
}) {
  const t = useTranslations("admin.users");
  const router = useRouter();
  const paginationUrl = usePaginationUrl();
  const [search, setSearch] = useState(() => initialSearch);
  const [data, setData] = useState(() => initialData);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const setSearchInUrl = paginationUrl.setSearch;
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
      setSearchInUrl(search);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search, setSearchInUrl]);

  function handleSetPlan(userId: string, plan: SubscriptionPlan) {
    setError(null);
    startTransition(async () => {
      const result = await adminSetUserPlanAction(userId, plan, locale);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setData((current) => ({
        ...current,
        items: current.items.map((row) => (row.id === userId ? { ...row, plan } : row)),
      }));
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

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

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
                onSetPlan={handleSetPlan}
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
        isLoading={isPending}
      />
    </div>
  );
}
