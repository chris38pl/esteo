"use client";

import { ArrowRight, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { UserAvatar } from "@/components/avatars/user-avatar";
import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BillingSidebarState } from "@/features/billing/billing-sidebar-state";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type PlanKey = "free" | "pro" | "business";

function resolvePlanKey(state: BillingSidebarState): PlanKey {
  if (state.variant === "status") {
    return "business";
  }
  return state.currentPlan === "PRO" ? "pro" : "free";
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function NavbarUserMenu({ locale }: { locale: Locale }) {
  const t = useTranslations("navbar.userMenu");
  const tInvitations = useTranslations("workspaces.invitations");
  const tSidebar = useTranslations("sidebar");
  const { user } = useUser();
  const { billingSidebarState, pendingInvitationCount } = useWorkspaceContext();

  const userName = user?.fullName || user?.firstName || tSidebar("user.placeholder.name");
  const userEmail =
    user?.primaryEmailAddress?.emailAddress ?? tSidebar("user.placeholder.email");

  const planKey = resolvePlanKey(billingSidebarState);
  const planLabel = t(`plans.${planKey}`);
  const billingHref = `/${locale}/dashboard/billing`;
  const accountHref = `/${locale}/dashboard/account`;
  const showBadge = pendingInvitationCount > 0;
  const badgeLabel = tInvitations("pendingBadge", { count: pendingInvitationCount });

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={showBadge ? badgeLabel : t("openMenu")}
          className={cn(
            "relative flex h-9 max-w-[min(240px,42vw)] shrink-0 items-center gap-2 rounded-lg",
            "border border-border/60 bg-card/40 px-1.5 transition",
            "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
            "sm:max-w-[min(280px,36vw)]",
          )}
        >
          <span className="relative shrink-0">
            <UserAvatar imageUrl={user?.imageUrl} size={30} className="ring-0" />
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

      <DropdownMenuContent align="end" className="w-72 p-0">
        <div className="flex items-start gap-3 p-4">
          <UserAvatar imageUrl={user?.imageUrl} size={40} className="ring-0" />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">
              {userName}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </div>

        <DropdownMenuSeparator className="mx-0" />

        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t("yourPlan")}</p>
            <span
              className={cn(
                "mt-1.5 inline-flex items-center rounded-md px-2 py-0.5",
                "bg-blue-500/10 text-[10px] font-semibold tracking-[0.08em] text-blue-600 uppercase",
                "ring-1 ring-blue-500/15 ring-inset",
                "dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/20",
              )}
            >
              {planLabel}
            </span>
          </div>
          <Link
            href={billingHref}
            className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("updatePlan")}
            <ArrowRight className="size-3.5" strokeWidth={2} />
          </Link>
        </div>

        <DropdownMenuSeparator className="mx-0" />

        <div className="space-y-2.5 px-4 py-3">
          <StatRow label={t("stats.requests")} value="12" />
          <StatRow label={t("stats.estimates")} value="2" />
          <StatRow label={t("stats.spaceUsage")} value="45%" />
        </div>

        <DropdownMenuSeparator className="mx-0" />

        <div className="py-1">
          <DropdownMenuItem asChild className="gap-2.5 px-4 py-2 text-sm">
            <Link href={accountHref}>
              <User className="size-4 text-muted-foreground" strokeWidth={1.75} />
              {t("myProfile")}
              {showBadge ? (
                <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {pendingInvitationCount}
                </span>
              ) : null}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="gap-2.5 px-4 py-2 text-sm">
            <Link href={accountHref}>
              <Settings className="size-4 text-muted-foreground" strokeWidth={1.75} />
              {t("accountSettings")}
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="mx-0 md:hidden" />

        <div className="px-4 py-2 md:hidden">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("language")}
          </p>
          <LocaleSwitcher value={locale} compact />
        </div>
        <div className="flex items-center justify-between px-4 pb-3 md:hidden">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("theme")}
          </span>
          <ThemeToggle compact />
        </div>

        <DropdownMenuSeparator className="mx-0" />

        <div className="py-1">
          <DropdownMenuItem asChild className="gap-2.5 px-4 py-2 text-sm">
            <SignOutButton>
              <button type="button" className="flex w-full items-center gap-2.5">
                <LogOut className="size-4 text-muted-foreground" strokeWidth={1.75} />
                {t("logout")}
              </button>
            </SignOutButton>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
