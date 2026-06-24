import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";

import type { Locale } from "@/lib/locale";
import { getPublicEstimateRequestPath } from "@/features/estimate-requests/routes";

export type NavItemKey =
  | "dashboard"
  | "requests"
  | "estimateRequestPage"
  | "estimates"
  | "payments"
  | "configuration"
  | "settings";

export type SidebarNavItem = {
  key: NavItemKey;
  icon: LucideIcon;
  /**
   * Generates the href for this nav item.
   * `workspaceSlug` is null for items that are workspace-independent (e.g. external links).
   */
  href: (locale: string, workspaceSlug: string | null) => string;
  labelKey: `nav.${NavItemKey}`;
  badge?: string;
  disabled?: boolean;
};

export const navItems: SidebarNavItem[] = [
  {
    key: "dashboard",
    icon: LayoutDashboard,
    href: (locale, workspaceSlug) =>
      workspaceSlug ? `/${locale}/dashboard/${workspaceSlug}` : `/${locale}/dashboard`,
    labelKey: "nav.dashboard",
  },
  {
    key: "requests",
    icon: FileText,
    href: (locale, workspaceSlug) =>
      workspaceSlug
        ? `/${locale}/dashboard/${workspaceSlug}/requests`
        : `/${locale}/dashboard`,
    labelKey: "nav.requests",
  },
  {
    key: "estimateRequestPage",
    icon: ClipboardList,
    href: (locale, workspaceSlug) =>
      workspaceSlug
        ? getPublicEstimateRequestPath(locale as Locale, workspaceSlug)
        : `/${locale}/dashboard`,
    labelKey: "nav.estimateRequestPage",
  },
  {
    key: "estimates",
    icon: BarChart3,
    href: (locale, workspaceSlug) =>
      workspaceSlug
        ? `/${locale}/dashboard/${workspaceSlug}/estimates`
        : `/${locale}/dashboard`,
    labelKey: "nav.estimates",
  },
  {
    key: "payments",
    icon: Wallet,
    href: (locale, workspaceSlug) =>
      workspaceSlug
        ? `/${locale}/dashboard/${workspaceSlug}/payments`
        : `/${locale}/dashboard`,
    labelKey: "nav.payments",
  },
  {
    key: "configuration",
    icon: SlidersHorizontal,
    href: (locale, workspaceSlug) =>
      workspaceSlug
        ? `/${locale}/dashboard/${workspaceSlug}/configuration`
        : `/${locale}/dashboard`,
    labelKey: "nav.configuration",
  },
  {
    key: "settings",
    icon: Settings,
    href: (locale, workspaceSlug) =>
      workspaceSlug
        ? `/${locale}/dashboard/${workspaceSlug}/settings`
        : `/${locale}/dashboard`,
    labelKey: "nav.settings",
  },
];

