"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/locale";
import { dashboardUpgradeHref } from "@/lib/dashboard-routes";
import { resolveBillingPlanCode } from "@/features/billing/billing-sidebar-state";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { sidebarNavSections } from "./nav-config";
import type { NavItemKey } from "./nav-config";
import { SidebarDivider } from "./sidebar-divider";
import { useWorkspaceContext } from "./workspace-context";
import { sidebarInsetClass } from "./sidebar-layout";
import { useSidebarLayout } from "./sidebar-layout-context";
import { useSidebarStore } from "./sidebar-store";

function configurationBasePath(locale: string, workspaceSlug: string) {
  return `/${locale}/dashboard/${workspaceSlug}/configuration`;
}

function isNavItemActive(
  key: NavItemKey,
  locale: string,
  pathname: string,
  tab: string | null,
  href: string,
  workspaceSlug: string | null,
) {
  const workspaceDashboardPath = workspaceSlug
    ? `/${locale}/dashboard/${workspaceSlug}`
    : `/${locale}/dashboard`;

  if (key === "dashboard") {
    return pathname === workspaceDashboardPath;
  }

  if (key === "aiRules" && workspaceSlug) {
    const base = configurationBasePath(locale, workspaceSlug);
    if (!pathname.startsWith(base)) {
      return false;
    }
    if (pathname.startsWith(`${base}/templates`)) {
      return false;
    }
    return tab !== "templates";
  }

  if (key === "templates" && workspaceSlug) {
    const base = configurationBasePath(locale, workspaceSlug);
    if (pathname.startsWith(`${base}/templates`)) {
      return true;
    }
    return pathname === base && tab === "templates";
  }

  if (key === "subscription" && workspaceSlug) {
    const billingBase = `/${locale}/dashboard/${workspaceSlug}/billing`;
    return pathname === billingBase || pathname.startsWith(`${billingBase}/`);
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
  const tab = searchParams?.get("tab") ?? null;
  const t = useTranslations("sidebar");
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();
  const { activeWorkspace, isPlatformAdmin, billingSidebarState } = useWorkspaceContext();
  const workspaceSlug = activeWorkspace?.slug ?? null;
  const isOwner = activeWorkspace?.isOwner === true;
  const planCode = resolveBillingPlanCode(billingSidebarState);
  const isFreePlan = planCode === "FREE";
  const templatesUpgradeHref =
    isOwner && workspaceSlug ? dashboardUpgradeHref(locale as Locale, workspaceSlug) : null;

  return (
    <TooltipProvider>
      <nav
        aria-label="Primary" // i18n-ignore-line
        className={cn(sidebarInsetClass(collapsed, inDrawer), "pb-1")}
      >
        {sidebarNavSections.map((section) => {
          if (section.ownerOnly && !isOwner) {
            return null;
          }

          return (
            <div key={section.id}>
              {section.dividerBefore ? <SidebarDivider /> : null}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const defaultHref = item.href(locale, workspaceSlug);
                  const active = isNavItemActive(
                    item.key,
                    locale,
                    pathname,
                    tab,
                    defaultHref,
                    workspaceSlug,
                  );
                  const label = t(item.labelKey);
                  const isDashboardComingSoon = item.key === "dashboard" && !isPlatformAdmin;
                  const isConfigurationItem = item.key === "aiRules" || item.key === "templates";
                  const isTemplatesFreeLocked = item.key === "templates" && isFreePlan;
                  const isOwnerLocked = isConfigurationItem && !isOwner;

                  const disabled =
                    item.disabled === true ||
                    isDashboardComingSoon ||
                    isOwnerLocked ||
                    (item.key === "settings" && !isOwner);

                  const href =
                    isTemplatesFreeLocked && templatesUpgradeHref
                      ? templatesUpgradeHref
                      : disabled
                        ? "#"
                        : defaultHref;

                  const isVisuallyMuted =
                    disabled || (isTemplatesFreeLocked && !isOwnerLocked);

                  const badge = isDashboardComingSoon ? t("nav.comingSoon") : item.badge;

                  let tooltipLabel = label;
                  if (disabled && item.key === "settings") {
                    tooltipLabel = `${label} — ${t("nav.settingsOwnerOnly")}`;
                  } else if (disabled && isConfigurationItem && isOwnerLocked) {
                    tooltipLabel = `${label} — ${t("nav.configurationOwnerOnly")}`;
                  } else if (disabled && item.key === "dashboard") {
                    tooltipLabel = `${label} — ${t("nav.comingSoon")}`;
                  } else if (isTemplatesFreeLocked) {
                    tooltipLabel = `${label} — ${t("nav.templatesUpgradeTooltip")}`;
                  }

                  const row = collapsed ? (
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      aria-disabled={disabled || undefined}
                      tabIndex={disabled ? -1 : 0}
                      data-active={active ? "true" : "false"}
                      className={cn(
                        "sidebar-nav-link mx-auto flex size-8 items-center justify-center rounded-lg transition-colors",
                        isVisuallyMuted && "opacity-45",
                        disabled && "pointer-events-none",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                      )}
                    >
                      <item.icon className="size-3.5" strokeWidth={1.75} />
                    </Link>
                  ) : (
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      aria-disabled={disabled || undefined}
                      tabIndex={disabled ? -1 : 0}
                      data-active={active ? "true" : "false"}
                      className={cn(
                        "sidebar-nav-link flex min-w-0 max-w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] leading-tight transition-colors",
                        isVisuallyMuted && "opacity-45",
                        disabled && "pointer-events-none",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                      )}
                    >
                      <item.icon className="size-3.5 shrink-0 opacity-80" strokeWidth={1.75} />
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
                      {collapsed || isTemplatesFreeLocked || disabled ? (
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
            </div>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
