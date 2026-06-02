import type { LucideIcon } from "lucide-react";
import { BarChart3, ClipboardList, FileText, LayoutDashboard, Settings } from "lucide-react";

export type NavItemKey =
  | "dashboard"
  | "requests"
  | "estimateRequestPage"
  | "estimates"
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
        ? `/${locale}/dashboard/${workspaceSlug}?section=requests`
        : `/${locale}/dashboard?section=requests`,
    labelKey: "nav.requests",
  },
  {
    key: "estimateRequestPage",
    icon: ClipboardList,
    href: (locale, workspaceSlug) =>
      workspaceSlug ? `/${locale}/wycena/${workspaceSlug}` : `/${locale}/dashboard`,
    labelKey: "nav.estimateRequestPage",
  },
  {
    key: "estimates",
    icon: BarChart3,
    href: (locale) => `/${locale}/estimates`,
    labelKey: "nav.estimates",
    badge: "Soon",
    disabled: true,
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

