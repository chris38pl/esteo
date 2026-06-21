import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Bug,
  Building2,
  ClipboardList,
  FileText,
  FolderTree,
  Layers3,
  Mic,
  Sparkles,
  UserRoundSearch,
  Users,
} from "lucide-react";

export type AdminNavItemKey =
  | "accountInspector"
  | "activationPreview"
  | "estimateRequests"
  | "industryFields"
  | "pdfPreview"
  | "storageExplorer"
  | "voiceIntakePreview"
  | "issues"
  | "users"
  | "workspaces"
  | "styleguide";

export type AdminNavItem = {
  key: AdminNavItemKey;
  icon: LucideIcon;
  href: (locale: string) => string;
  labelKey: `admin.nav.${AdminNavItemKey}`;
};

export const adminNavItems: AdminNavItem[] = [
  {
    key: "users",
    icon: Users,
    href: (locale) => `/${locale}/dashboard/admin/users`,
    labelKey: "admin.nav.users",
  },
  {
    key: "workspaces",
    icon: Building2,
    href: (locale) => `/${locale}/dashboard/admin/workspaces`,
    labelKey: "admin.nav.workspaces",
  },
  {
    key: "estimateRequests",
    icon: ClipboardList,
    href: (locale) => `/${locale}/dashboard/admin/estimate-requests`,
    labelKey: "admin.nav.estimateRequests",
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
    key: "pdfPreview",
    icon: FileText,
    href: (locale) => `/${locale}/dashboard/admin/pdf-preview`,
    labelKey: "admin.nav.pdfPreview",
  },
  {
    key: "storageExplorer",
    icon: FolderTree,
    href: (locale) => `/${locale}/dashboard/admin/storage`,
    labelKey: "admin.nav.storageExplorer",
  },
  {
    key: "voiceIntakePreview",
    icon: Mic,
    href: (locale) => `/${locale}/dashboard/admin/voice-intake-preview`,
    labelKey: "admin.nav.voiceIntakePreview",
  },
  {
    key: "activationPreview",
    icon: Sparkles,
    href: (locale) => `/${locale}/dashboard/admin/activation-preview`,
    labelKey: "admin.nav.activationPreview",
  },
  {
    key: "issues",
    icon: Bug,
    href: (locale) => `/${locale}/dashboard/admin/issues`,
    labelKey: "admin.nav.issues",
  },
  {
    key: "styleguide",
    icon: BookOpen,
    href: (locale) => `/${locale}/styleguide`,
    labelKey: "admin.nav.styleguide",
  },
];
