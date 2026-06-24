"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { navItems } from "./nav-config";
import type { NavItemKey } from "./nav-config";
import { useWorkspaceContext } from "./workspace-context";
import { sidebarInsetClass } from "./sidebar-layout";
import { useSidebarLayout } from "./sidebar-layout-context";
import { useSidebarStore } from "./sidebar-store";

function isNavItemActive(
  key: NavItemKey,
  locale: string,
  pathname: string,
  section: string | null,
  href: string,
  workspaceSlug: string | null,
) {
  const workspaceDashboardPath = workspaceSlug
    ? `/${locale}/dashboard/${workspaceSlug}`
    : `/${locale}/dashboard`;

  if (key === "dashboard") {
    return pathname === workspaceDashboardPath;
  }

  if (key === "requests") {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  locale,
  collapsedOverride,
}: {
  locale: string;
  collapsedOverride?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section = searchParams?.get("section");
  const t = useTranslations("sidebar");
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();
  const { activeWorkspace, isPlatformAdmin } = useWorkspaceContext();
  const workspaceSlug = activeWorkspace?.slug ?? null;
  const canAccessWorkspaceSettings = activeWorkspace?.isOwner === true;

  return (
    <TooltipProvider>
      <nav
        aria-label="Primary" // i18n-ignore-line
        className={cn(sidebarInsetClass(collapsed, inDrawer), "pb-1")}
      >
        <ul className="space-y-1">
          {navItems.map((item) => {
            const href = item.href(locale, workspaceSlug);
            const active = isNavItemActive(item.key, locale, pathname, section, href, workspaceSlug);
            const label = t(item.labelKey);
            const isDashboardComingSoon = item.key === "dashboard" && !isPlatformAdmin;
            const disabled =
              item.disabled === true ||
              ((item.key === "settings" || item.key === "configuration") &&
                !canAccessWorkspaceSettings) ||
              isDashboardComingSoon;
            const badge = isDashboardComingSoon ? t("nav.comingSoon") : item.badge;
            const tooltipLabel =
              disabled && item.key === "settings"
                ? `${label} — ${t("nav.settingsOwnerOnly")}`
                : disabled && item.key === "configuration"
                  ? `${label} — ${t("nav.configurationOwnerOnly")}`
                : disabled && item.key === "dashboard"
                  ? `${label} — ${t("nav.comingSoon")}`
                  : label;

            const row = collapsed ? (
              <Link
                href={disabled ? "#" : href}
                aria-current={active ? "page" : undefined}
                aria-disabled={disabled || undefined}
                tabIndex={disabled ? -1 : 0}
                data-active={active ? "true" : "false"}
                className={cn(
                  "sidebar-nav-link mx-auto flex size-8 items-center justify-center rounded-lg transition-colors",
                  disabled && "pointer-events-none opacity-45",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                )}
              >
                <item.icon className="size-3.5" strokeWidth={1.75} />
              </Link>
            ) : (
              <Link
                href={disabled ? "#" : href}
                aria-current={active ? "page" : undefined}
                aria-disabled={disabled || undefined}
                tabIndex={disabled ? -1 : 0}
                data-active={active ? "true" : "false"}
                className={cn(
                  "sidebar-nav-link flex min-w-0 max-w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] leading-tight transition-colors",
                  disabled && "pointer-events-none opacity-45",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                )}
              >
                <item.icon
                  className="size-3.5 shrink-0 opacity-80"
                  strokeWidth={1.75}
                />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {badge ? (
                  <span className="shrink-0 rounded border border-sidebar-search-border bg-[var(--sidebar-search)] px-1 py-px text-[9px] font-medium text-[var(--sidebar-section)]">
                    {badge}
                  </span>
                ) : null}
              </Link>
            );

            return (
              <li key={item.key}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{row}</TooltipTrigger>
                    <TooltipContent side="right">{tooltipLabel}</TooltipContent>
                  </Tooltip>
                ) : (
                  row
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </TooltipProvider>
  );
}
