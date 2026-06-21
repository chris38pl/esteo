"use client";

import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { SidebarDivider } from "@/components/layout/app-sidebar/sidebar-divider";
import { sidebarInsetClass } from "@/components/layout/app-sidebar/sidebar-layout";
import { useSidebarLayout } from "@/components/layout/app-sidebar/sidebar-layout-context";
import { useSidebarStore } from "@/components/layout/app-sidebar/sidebar-store";
import { dashboardTipsHref } from "@/lib/dashboard-routes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function SidebarTips({
  collapsedOverride,
}: {
  collapsedOverride?: boolean;
} = {}) {
  const t = useTranslations("sidebar");
  const pathname = usePathname();
  const { activeWorkspace, locale } = useWorkspaceContext();
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();

  if (!activeWorkspace?.slug) {
    return null;
  }

  const href = dashboardTipsHref(locale, activeWorkspace.slug);
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const label = t("tips");

  const row = collapsed ? (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      data-active={active ? "true" : "false"}
      className={cn(
        "sidebar-nav-link mx-auto flex size-8 items-center justify-center rounded-lg transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
      )}
    >
      <Lightbulb className="size-3.5 shrink-0 opacity-80" strokeWidth={1.75} />
    </Link>
  ) : (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      data-active={active ? "true" : "false"}
      className={cn(
        "sidebar-nav-link flex min-w-0 max-w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] leading-tight transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
      )}
    >
      <Lightbulb className="size-3.5 shrink-0 opacity-80" strokeWidth={1.75} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </Link>
  );

  return (
    <>
      <SidebarDivider />
      <div className={cn(sidebarInsetClass(collapsed, inDrawer), "pb-1 pt-1")}>
        <ul>
          <li>
            {collapsed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>{row}</TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              row
            )}
          </li>
        </ul>
      </div>
    </>
  );
}
