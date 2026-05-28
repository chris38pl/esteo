import type { LucideIcon } from "lucide-react";
import { BarChart3, FileText, LayoutDashboard, Settings } from "lucide-react";

export type NavItemKey = "dashboard" | "requests" | "estimates" | "settings";

export type SidebarNavItem = {
  key: NavItemKey;
  icon: LucideIcon;
  href: (locale: string) => string;
  labelKey: `nav.${NavItemKey}`;
  badge?: string;
  disabled?: boolean;
};

export const navItems: SidebarNavItem[] = [
  {
    key: "dashboard",
    icon: LayoutDashboard,
    href: (locale) => `/${locale}/dashboard`,
    labelKey: "nav.dashboard",
  },
  {
    key: "requests",
    icon: FileText,
    href: (locale) => `/${locale}/dashboard?section=requests`,
    labelKey: "nav.requests",
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
    href: (locale) => `/${locale}/settings`,
    labelKey: "nav.settings",
    badge: "Soon",
    disabled: true,
  },
];

