"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import type { Locale } from "@/lib/locale";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PageLabelKey =
  | "billing"
  | "settings"
  | "onboarding"
  | "newWorkspace"
  | "pendingAccess"
  | "invitations"
  | "account"
  | "requests"
  | "accountInspector"
  | "adminWorkspaces"
  | "adminIndustryFields";

function resolvePageLabelKey(
  pathname: string,
  locale: Locale,
  section: string | null,
): PageLabelKey | null {
  const base = `/${locale}/dashboard`;

  if (pathname === `${base}/billing`) {
    return "billing";
  }
  if (pathname === `${base}/workspaces/settings`) {
    return "settings";
  }
  if (pathname === `${base}/onboarding`) {
    return "onboarding";
  }
  if (pathname === `${base}/workspaces/new`) {
    return "newWorkspace";
  }
  if (pathname === `${base}/pending-access`) {
    return "pendingAccess";
  }
  if (pathname === `${base}/invitations`) {
    return "invitations";
  }
  if (pathname === `${base}/account`) {
    return "account";
  }
  if (pathname === `${base}/admin/account-inspector`) {
    return "accountInspector";
  }
  if (pathname === `${base}/admin/workspaces`) {
    return "adminWorkspaces";
  }
  if (pathname === `${base}/admin/industry-fields`) {
    return "adminIndustryFields";
  }
  if (pathname === base && section === "requests") {
    return "requests";
  }
  if (pathname === base) {
    return null;
  }

  return null;
}

export function useDashboardBreadcrumbs(locale: Locale): BreadcrumbItem[] {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const section = searchParams?.get("section");
  const t = useTranslations("navbar.breadcrumbs");
  const { activeWorkspace } = useWorkspaceContext();

  const dashboardHref = `/${locale}/dashboard`;
  const pageKey = resolvePageLabelKey(pathname, locale, section);
  const isAdminPath = pathname.startsWith(`/${locale}/dashboard/admin`);

  const workspaceLabel =
    activeWorkspace?.name?.trim() || t("workspace");

  const crumbs: BreadcrumbItem[] = [
    { label: t("dashboard"), href: dashboardHref },
  ];

  if (isAdminPath) {
    crumbs.push({ label: t("admin") });
  } else {
    crumbs.push({ label: workspaceLabel });
  }

  if (pageKey) {
    crumbs.push({ label: t(pageKey) });
  }

  return crumbs;
}
