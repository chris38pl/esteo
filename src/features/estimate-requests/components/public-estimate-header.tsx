"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import type { CurrentUserProfile } from "@/components/layout/app-sidebar/workspace-context";
import { FocusedDashboardUserMenu } from "@/components/layout/dashboard-top-nav/focused-dashboard-user-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function BackButton({ backHref, ariaLabel }: { backHref: string; ariaLabel: string }) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="size-9 shrink-0 rounded-lg border-border/60 bg-card/40"
      asChild
    >
      <Link href={backHref} aria-label={ariaLabel}>
        <ArrowLeft className="size-4" />
      </Link>
    </Button>
  );
}

export function PublicEstimateHeader({
  backHref,
  currentUser,
}: {
  backHref: string;
  currentUser: CurrentUserProfile;
}) {
  const tCommon = useTranslations("common");
  const tSidebar = useTranslations("sidebar");
  const backLabel = tCommon("actions.back");

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 md:hidden",
          "bg-background/85 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/75",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <BackButton backHref={backHref} ariaLabel={backLabel} />
          <p className="truncate text-sm font-medium">{tSidebar("meta.appName")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <FocusedDashboardUserMenu currentUser={currentUser} variant="compact" />
        </div>
      </header>

      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 hidden justify-between p-3 sm:p-4 md:flex">
        <div className="pointer-events-auto">
          <BackButton backHref={backHref} ariaLabel={backLabel} />
        </div>
        <div className="pointer-events-auto">
          <FocusedDashboardUserMenu currentUser={currentUser} variant="default" />
        </div>
      </div>
    </>
  );
}
