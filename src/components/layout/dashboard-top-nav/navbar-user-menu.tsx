"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  LogOut,
  PieChart,
  Settings,
  User,
} from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { UserAvatar } from "@/components/avatars/user-avatar";
import { WorkspaceAvatar } from "@/components/avatars/workspace-avatar";
import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BillingSidebarState } from "@/features/billing/billing-sidebar-state";
import { dashboardAccountHref, dashboardBillingHref, ownedWorkspaceBillingHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type PlanKey = "free" | "pro" | "business";

function resolvePlanKey(state: BillingSidebarState): PlanKey {
  if (state.variant === "status") {
    return "business";
  }
  return state.currentPlan === "PRO" ? "pro" : "free";
}

function MenuSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </p>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CircleHelp;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function AccountMenuRow({
  href,
  icon: Icon,
  label,
  badge,
}: {
  href: string;
  icon: typeof User;
  label: string;
  badge?: number;
}) {
  return (
    <DropdownMenuItem asChild className="gap-2.5 px-4 py-2 text-sm">
      <Link href={href}>
        <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {badge ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {badge}
          </span>
        ) : null}
        <ChevronRight className="size-4 text-muted-foreground/70" strokeWidth={2} aria-hidden />
      </Link>
    </DropdownMenuItem>
  );
}

function WorkspaceMenuItem({
  workspace,
  activeWorkspaceId,
  onSelect,
}: {
  workspace: { id: string; name: string; slug: string; logoUrl?: string | null };
  activeWorkspaceId: string;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem className="gap-2.5 text-sm" onSelect={onSelect}>
      <WorkspaceAvatar
        name={workspace.name}
        logoUrl={workspace.logoUrl}
        size={24}
        className="rounded-md ring-0"
      />
      <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
      {workspace.id === activeWorkspaceId ? (
        <Check className="size-4 shrink-0 text-primary" strokeWidth={2} />
      ) : null}
    </DropdownMenuItem>
  );
}

export function NavbarUserMenu({ locale }: { locale: Locale }) {
  const t = useTranslations("navbar.userMenu");
  const tInvitations = useTranslations("workspaces.invitations");
  const {
    billingSidebarState,
    pendingInvitationCount,
    currentUser,
    activeWorkspace,
    activeWorkspaceStats,
    workspaces,
    switchWorkspace,
  } = useWorkspaceContext();

  const userName = currentUser.name?.trim() || currentUser.email;
  const userEmail = currentUser.email;

  const planKey = resolvePlanKey(billingSidebarState);
  const planLabel = t(`plans.${planKey}`);
  const billingHref =
    activeWorkspace?.isOwner && activeWorkspace.slug
      ? dashboardBillingHref(locale, activeWorkspace.slug)
      : ownedWorkspaceBillingHref(locale, workspaces);
  const accountHref = dashboardAccountHref(locale);
  const showBadge = pendingInvitationCount > 0;
  const badgeLabel = tInvitations("pendingBadge", { count: pendingInvitationCount });

  const requestCount = activeWorkspaceStats?.requestCount ?? 0;
  const estimateCount = activeWorkspaceStats?.estimateCount ?? 0;
  const storagePercent = activeWorkspace?.storageUsedPercent ?? 0;
  const [mobileWorkspaceOpen, setMobileWorkspaceOpen] = useState(false);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={showBadge ? badgeLabel : t("openMenu")}
          className={cn(
            "relative flex shrink-0 items-center rounded-lg border border-border/60 bg-card/40 transition",
            "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
            "size-9 justify-center gap-0 p-0 max-sm:max-w-none",
            "sm:h-9 sm:w-auto sm:max-w-[min(280px,36vw)] sm:justify-start sm:gap-2 sm:px-1.5",
          )}
        >
          <span className="relative shrink-0 leading-none">
            <UserAvatar
              imageUrl={currentUser.avatarUrl}
              avatarPreset={currentUser.avatarPreset}
              size={26}
              className="ring-0 sm:hidden"
            />
            <UserAvatar
              imageUrl={currentUser.avatarUrl}
              avatarPreset={currentUser.avatarPreset}
              size={30}
              className="hidden ring-0 sm:block"
            />
            {showBadge ? (
              <span
                aria-hidden
                className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground ring-2 ring-background"
              >
                {pendingInvitationCount > 9 ? "9+" : pendingInvitationCount}
              </span>
            ) : null}
          </span>
          <span className="hidden min-w-0 flex-1 flex-col items-start text-left sm:flex">
            <span className="w-full truncate text-xs font-medium leading-tight text-foreground">
              {userName}
            </span>
            <span className="w-full truncate text-[10px] leading-tight text-muted-foreground">
              {userEmail}
            </span>
          </span>
          <ChevronDown
            className="hidden size-3.5 shrink-0 text-muted-foreground sm:block"
            strokeWidth={2}
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-xl border-border/60 p-0 shadow-lg"
      >
        <div className="flex items-center gap-3 px-4 pb-2.5 pt-4">
          <UserAvatar
            imageUrl={currentUser.avatarUrl}
            avatarPreset={currentUser.avatarPreset}
            size={40}
            className="ring-0"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">{userName}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </div>

        <DropdownMenuSeparator className="mx-0 bg-border/60" />

        {activeWorkspace ? (
          <>
            <div className="px-4 pt-2 pb-1">
              <MenuSectionLabel>{t("activeWorkspace")}</MenuSectionLabel>

              <div className="mt-1 md:hidden">
                <button
                  type="button"
                  className={cn(
                    "flex h-auto w-full items-center gap-2.5 rounded-lg px-1 py-2 text-left transition-colors",
                    "hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                    mobileWorkspaceOpen && "bg-accent/40",
                  )}
                  aria-expanded={mobileWorkspaceOpen}
                  onClick={() => setMobileWorkspaceOpen((open) => !open)}
                >
                  <WorkspaceAvatar
                    name={activeWorkspace.name}
                    logoUrl={activeWorkspace.logoUrl}
                    size={36}
                    className="rounded-lg ring-0"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                    {activeWorkspace.name}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform",
                      mobileWorkspaceOpen && "rotate-180",
                    )}
                    strokeWidth={2}
                    aria-hidden
                  />
                </button>
                {mobileWorkspaceOpen ? (
                  <div className="mt-1 max-h-48 space-y-0.5 overflow-y-auto rounded-lg border border-border/60 bg-muted/20 p-1">
                    {workspaces.map((workspace) => (
                      <WorkspaceMenuItem
                        key={workspace.id}
                        workspace={workspace}
                        activeWorkspaceId={activeWorkspace.id}
                        onSelect={() => switchWorkspace(workspace.slug)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  className={cn(
                    "mt-1 hidden h-auto w-full rounded-lg px-1 py-0.5 md:flex",
                    "focus:bg-accent/40 data-[state=open]:bg-accent/40",
                    "[&>svg:last-child]:hidden",
                  )}
                >
                  <WorkspaceAvatar
                    name={activeWorkspace.name}
                    logoUrl={activeWorkspace.logoUrl}
                    size={36}
                    className="rounded-lg ring-0"
                  />
                  <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-foreground">
                    {activeWorkspace.name}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-56 rounded-lg">
                  {workspaces.map((workspace) => (
                    <WorkspaceMenuItem
                      key={workspace.id}
                      workspace={workspace}
                      activeWorkspaceId={activeWorkspace.id}
                      onSelect={() => switchWorkspace(workspace.slug)}
                    />
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </div>

            <DropdownMenuSeparator className="mx-0 bg-border/60" />

            <div className="flex items-center justify-between gap-3 px-4 py-1.5">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t("yourPlan")}</p>
                <span
                  className={cn(
                    "mt-1 inline-flex items-center rounded-md px-2 py-0.5",
                    "bg-blue-500/10 text-[10px] font-semibold tracking-[0.08em] text-blue-600 uppercase",
                    "ring-1 ring-blue-500/15 ring-inset",
                    "dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/20",
                  )}
                >
                  {planLabel}
                </span>
              </div>
              {billingHref ? (
                <Link
                  href={billingHref}
                  className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("updatePlan")}
                  <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden />
                </Link>
              ) : null}
            </div>

            <DropdownMenuSeparator className="mx-0 bg-border/60" />

            <div className="space-y-2 px-4 pb-0.5 pt-1.5">
              <StatRow
                icon={CircleHelp}
                label={t("stats.requests")}
                value={String(requestCount)}
              />
              <StatRow
                icon={CheckCircle2}
                label={t("stats.estimates")}
                value={String(estimateCount)}
              />
              <StatRow
                icon={PieChart}
                label={t("stats.spaceUsage")}
                value={`${storagePercent}%`}
              />
              <div
                className="h-1 overflow-hidden rounded-full bg-muted/50"
                role="progressbar"
                aria-valuenow={storagePercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t("stats.spaceUsage")}
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.min(100, storagePercent)}%` }}
                />
              </div>
            </div>

            <DropdownMenuSeparator className="mx-0 bg-border/60" />
          </>
        ) : null}

        <div className="px-4 py-2 md:hidden">
          <MenuSectionLabel>{t("options")}</MenuSectionLabel>
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">{t("language")}</span>
              <LocaleSwitcher value={locale} compact compactSize="sm" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">{t("theme")}</span>
              <ThemeToggle compact compactSize="sm" />
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="mx-0 bg-border/60 md:hidden" />

        <div className="px-4 pb-1 pt-3">
          <MenuSectionLabel>{t("userAccount")}</MenuSectionLabel>
        </div>

        <AccountMenuRow
          href={accountHref}
          icon={User}
          label={t("myProfile")}
          badge={showBadge ? pendingInvitationCount : undefined}
        />
        <AccountMenuRow href={accountHref} icon={Settings} label={t("accountSettings")} />
        <DropdownMenuSeparator className="mx-4 bg-border/60" />
        <DropdownMenuItem
          asChild
          className="gap-2.5 px-4 py-2 pb-3 text-sm text-destructive focus:text-destructive"
        >
          <SignOutButton>
            <button type="button" className="flex w-full items-center gap-2.5">
              <LogOut className="size-4" strokeWidth={1.75} aria-hidden />
              <span className="flex-1 text-left">{t("logout")}</span>
            </button>
          </SignOutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
