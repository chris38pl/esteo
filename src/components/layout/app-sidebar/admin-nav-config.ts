import type { LucideIcon } from "lucide-react";
import { Layers3, UserRoundSearch } from "lucide-react";

export type AdminNavItemKey = "accountInspector" | "industryFields";

export type AdminNavItem = {
  key: AdminNavItemKey;
  icon: LucideIcon;
  href: (locale: string) => string;
  labelKey: `admin.nav.${AdminNavItemKey}`;
};

export const adminNavItems: AdminNavItem[] = [
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
];
