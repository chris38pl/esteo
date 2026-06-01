"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

import { UserAvatar } from "@/components/avatars/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function FocusedDashboardUserMenu({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) {
  const t = useTranslations("navbar.userMenu");
  const tSidebar = useTranslations("sidebar");
  const { user } = useUser();
  const compact = variant === "compact";

  const userName = user?.fullName || user?.firstName || tSidebar("user.placeholder.name");
  const userEmail =
    user?.primaryEmailAddress?.emailAddress ?? tSidebar("user.placeholder.email");

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
          <UserAvatar imageUrl={user?.imageUrl} size={compact ? 26 : 30} className="ring-0" />
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
          <UserAvatar imageUrl={user?.imageUrl} size={40} className="ring-0" />
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
