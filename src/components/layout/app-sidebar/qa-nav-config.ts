import type { LucideIcon } from "lucide-react";
import { Bug } from "lucide-react";

export type QaNavItemKey = "issues";

export type QaNavItem = {
  key: QaNavItemKey;
  icon: LucideIcon;
  href: (locale: string) => string;
  labelKey: `qaTesting.nav.${QaNavItemKey}`;
};

export const qaNavItems: QaNavItem[] = [
  {
    key: "issues",
    icon: Bug,
    href: (locale) => `/${locale}/dashboard/qa/issues`,
    labelKey: "qaTesting.nav.issues",
  },
];
