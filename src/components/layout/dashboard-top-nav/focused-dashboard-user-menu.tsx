"use client";

import { useContext } from "react";
import { ChevronDown, ChevronRight, LogOut, User } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { UserAvatar } from "@/components/avatars/user-avatar";
import {
  WorkspaceContext,
  type CurrentUserProfile,
} from "@/components/layout/app-sidebar/workspace-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dashboardAccountHref } from "@/lib/dashboard-routes";
import { isLocale, type Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export function FocusedDashboardUserMenu({
  variant = "default",
  currentUser: currentUserProp,
}: {
  variant?: "default" | "compact";
  currentUser?: CurrentUserProfile;
}) {
  const t = useTranslations("navbar.userMenu");
  const localeFromHook = useLocale();
  const workspaceContext = useContext(WorkspaceContext);
  const currentUser = currentUserProp ?? workspaceContext?.currentUser;

  if (!currentUser) {
    return null;
  }

  const locale: Locale =
    workspaceContext?.locale ?? (isLocale(localeFromHook) ? localeFromHook : "pl");
  const accountHref = dashboardAccountHref(locale);
  const pendingInvitationCount = workspaceContext?.pendingInvitationCount ?? 0;
  const showBadge = pendingInvitationCount > 0;

  const compact = variant === "compact";

  const userName = currentUser.name?.trim() || currentUser.email;
  const userEmail = currentUser.email;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("openMenu")}
          className={cn(
            "shrink-0 transition hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
            compact
              ? "flex size-9 items-center justify-center rounded-lg border border-border/60 bg-card/40 p-0"
              : cn(
                  "flex h-9 max-w-[min(240px,42vw)] items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-1.5",
                  "sm:max-w-[min(280px,36vw)]",
                ),
          )}
        >
          <UserAvatar
            imageUrl={currentUser.avatarUrl}
            avatarPreset={currentUser.avatarPreset}
            size={compact ? 26 : 30}
            className="ring-0"
          />
          {!compact ? (
            <>
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
            </>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-0">
        <div className="flex items-start gap-3 p-4">
          <UserAvatar
            imageUrl={currentUser.avatarUrl}
            avatarPreset={currentUser.avatarPreset}
            size={40}
            className="ring-0"
          />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">
              {userName}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </div>

        <DropdownMenuSeparator className="mx-0" />

        <div className="py-1">
          <DropdownMenuItem asChild className="gap-2.5 px-4 py-2 text-sm">
            <Link href={accountHref}>
              <User className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
              <span className="min-w-0 flex-1 truncate">{t("myProfile")}</span>
              {showBadge ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {pendingInvitationCount}
                </span>
              ) : null}
              <ChevronRight className="size-4 text-muted-foreground/70" strokeWidth={2} aria-hidden />
            </Link>
          </DropdownMenuItem>
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
