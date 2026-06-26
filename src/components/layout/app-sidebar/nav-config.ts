import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CreditCard,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  Settings,
  SlidersHorizontal,
  UserPlus,
  Wallet,
} from "lucide-react";

import { dashboardBillingHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";

export type NavItemKey =
  | "dashboard"
  | "requests"
  | "estimates"
  | "payments"
  | "aiRules"
  | "templates"
  | "customerAcquisition"
  | "subscription"
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
  /** Opens an in-app dialog instead of navigating. */
  opensModal?: boolean;
};

export type SidebarNavSection = {
  id: string;
  dividerBefore?: boolean;
  /** Render this section only for workspace owners. */
  ownerOnly?: boolean;
  items: SidebarNavItem[];
};

const dashboardItem: SidebarNavItem = {
  key: "dashboard",
  icon: LayoutDashboard,
  href: (locale, workspaceSlug) =>
    workspaceSlug ? `/${locale}/dashboard/${workspaceSlug}` : `/${locale}/dashboard`,
  labelKey: "nav.dashboard",
};

const requestsItem: SidebarNavItem = {
  key: "requests",
  icon: FileText,
  href: (locale, workspaceSlug) =>
    workspaceSlug ? `/${locale}/dashboard/${workspaceSlug}/requests` : `/${locale}/dashboard`,
  labelKey: "nav.requests",
};

const estimatesItem: SidebarNavItem = {
  key: "estimates",
  icon: BarChart3,
  href: (locale, workspaceSlug) =>
    workspaceSlug ? `/${locale}/dashboard/${workspaceSlug}/estimates` : `/${locale}/dashboard`,
  labelKey: "nav.estimates",
};

const paymentsItem: SidebarNavItem = {
  key: "payments",
  icon: Wallet,
  href: (locale, workspaceSlug) =>
    workspaceSlug ? `/${locale}/dashboard/${workspaceSlug}/payments` : `/${locale}/dashboard`,
  labelKey: "nav.payments",
};

const aiRulesItem: SidebarNavItem = {
  key: "aiRules",
  icon: SlidersHorizontal,
  href: (locale, workspaceSlug) =>
    workspaceSlug
      ? `/${locale}/dashboard/${workspaceSlug}/configuration?tab=rules`
      : `/${locale}/dashboard`,
  labelKey: "nav.aiRules",
};

const templatesItem: SidebarNavItem = {
  key: "templates",
  icon: LayoutTemplate,
  href: (locale, workspaceSlug) =>
    workspaceSlug
      ? `/${locale}/dashboard/${workspaceSlug}/configuration?tab=templates`
      : `/${locale}/dashboard`,
  labelKey: "nav.templates",
};

const customerAcquisitionItem: SidebarNavItem = {
  key: "customerAcquisition",
  icon: UserPlus,
  href: (locale, workspaceSlug) =>
    workspaceSlug ? `/${locale}/dashboard/${workspaceSlug}` : `/${locale}/dashboard`,
  labelKey: "nav.customerAcquisition",
  opensModal: true,
};

const subscriptionItem: SidebarNavItem = {
  key: "subscription",
  icon: CreditCard,
  href: (locale, workspaceSlug) =>
    workspaceSlug ? dashboardBillingHref(locale as Locale, workspaceSlug) : `/${locale}/dashboard`,
  labelKey: "nav.subscription",
};

const settingsItem: SidebarNavItem = {
  key: "settings",
  icon: Settings,
  href: (locale, workspaceSlug) =>
    workspaceSlug ? `/${locale}/dashboard/${workspaceSlug}/settings` : `/${locale}/dashboard`,
  labelKey: "nav.settings",
};

export const sidebarNavSections: SidebarNavSection[] = [
  {
    id: "overview",
    items: [dashboardItem, customerAcquisitionItem],
  },
  {
    id: "work",
    dividerBefore: true,
    items: [requestsItem, estimatesItem, paymentsItem],
  },
  {
    id: "ai",
    dividerBefore: true,
    items: [aiRulesItem, templatesItem],
  },
  {
    id: "owner",
    dividerBefore: true,
    ownerOnly: true,
    items: [subscriptionItem, settingsItem],
  },
];

/** @deprecated Use sidebarNavSections */
export const navItems: SidebarNavItem[] = sidebarNavSections.flatMap((section) => section.items);
