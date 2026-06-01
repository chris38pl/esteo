import type { LucideIcon } from "lucide-react";
import { BookOpen, Building2, Layers3, UserRoundSearch } from "lucide-react";

export type AdminNavItemKey = "accountInspector" | "industryFields" | "workspaces" | "styleguide";

export type AdminNavItem = {
  key: AdminNavItemKey;
  icon: LucideIcon;
  href: (locale: string) => string;
  labelKey: `admin.nav.${AdminNavItemKey}`;
};

export const adminNavItems: AdminNavItem[] = [
  {
    key: "workspaces",
    icon: Building2,
    href: (locale) => `/${locale}/dashboard/admin/workspaces`,
    labelKey: "admin.nav.workspaces",
  },
  {
    key: "accountInspector",
    icon: UserRoundSearch,
    href: (locale) => `/${locale}/dashboard/admin/account-inspector`,
    labelKey: "admin.nav.accountInspector",
  },
  {
    key: "industryFields",
    icon: Layers3,
    href: (locale) => `/${locale}/dashboard/admin/industry-fields`,
    labelKey: "admin.nav.industryFields",
  },
  {
    key: "styleguide",
    icon: BookOpen,
    href: (locale) => `/${locale}/styleguide`,
    labelKey: "admin.nav.styleguide",
  },
];
