"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { useDashboardBreadcrumbDetail } from "@/components/layout/dashboard-top-nav/dashboard-breadcrumb-detail-context";
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
  | "adminUsers"
  | "adminWorkspaces"
  | "adminIndustryFields"
  | "adminEstimateRequests"
  | "adminEstimateRequestDetail";

type EstimatesRoute =
  | { kind: "list" }
  | { kind: "detail"; estimateId: string };

function parseEstimatesRoute(
  pathname: string,
  locale: Locale,
  workspaceSlug: string | null,
): EstimatesRoute | null {
  if (!workspaceSlug) {
    return null;
  }

  const base = `/${locale}/dashboard/${workspaceSlug}/estimates`;
  if (pathname === base) {
    return { kind: "list" };
  }

  if (pathname.startsWith(`${base}/`)) {
    const suffix = pathname.slice(base.length + 1);
    const estimateId = suffix.split("/")[0];
    if (estimateId) {
      return { kind: "detail", estimateId };
    }
  }

  return null;
}

function resolvePageLabelKey(
  pathname: string,
  locale: Locale,
  section: string | null,
  workspaceSlug: string | null,
): PageLabelKey | null {
  const base = `/${locale}/dashboard`;
  const wsBase = workspaceSlug ? `${base}/${workspaceSlug}` : null;

  // Workspace-scoped pages (new slug-based paths)
  if (wsBase) {
    if (pathname === `${wsBase}/billing`) return "billing";
    if (pathname === `${wsBase}/settings`) return "settings";
    if (pathname === `${wsBase}/account`) return "account";
    if (pathname === wsBase && section === "requests") return "requests";
    if (pathname === wsBase) return null;
  }

  // Legacy paths (kept for the backward-compat redirect period)
  if (pathname === `${base}/billing`) return "billing";
  if (pathname === `${base}/workspaces/settings`) return "settings";
  if (pathname === `${base}/account`) return "account";

  // Workspace-free paths
  if (pathname === `${base}/onboarding`) return "onboarding";
  if (pathname === `${base}/workspaces/new`) return "newWorkspace";
  if (pathname === `${base}/pending-access`) return "pendingAccess";
  if (pathname === `${base}/invitations`) return "invitations";
  if (pathname === `${base}/admin/account-inspector`) return "accountInspector";
  if (pathname === `${base}/admin/users`) return "adminUsers";
  if (pathname === `${base}/admin/workspaces`) return "adminWorkspaces";
  if (pathname === `${base}/admin/industry-fields`) return "adminIndustryFields";
  if (pathname === `${base}/admin/estimate-requests`) return "adminEstimateRequests";
  if (pathname.startsWith(`${base}/admin/estimate-requests/`)) return "adminEstimateRequestDetail";

  return null;
}

export function useDashboardBreadcrumbs(locale: Locale): BreadcrumbItem[] {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const section = searchParams?.get("section");
  const t = useTranslations("navbar.breadcrumbs");
  const { activeWorkspace } = useWorkspaceContext();
  const { detailLabel } = useDashboardBreadcrumbDetail();

  const workspaceSlug = activeWorkspace?.slug ?? null;
  const dashboardHref = workspaceSlug
    ? `/${locale}/dashboard/${workspaceSlug}`
    : `/${locale}/dashboard`;
  const estimatesRoute = parseEstimatesRoute(pathname, locale, workspaceSlug);
  const pageKey = resolvePageLabelKey(pathname, locale, section, workspaceSlug);
  const isAdminPath = pathname.startsWith(`/${locale}/dashboard/admin`);

  const workspaceLabel = activeWorkspace?.name?.trim() || t("workspace");

  const crumbs: BreadcrumbItem[] = [
    { label: t("dashboard"), href: dashboardHref },
  ];

  if (isAdminPath) {
    crumbs.push({ label: t("admin") });
  } else {
    crumbs.push({ label: workspaceLabel });
  }

  if (estimatesRoute && workspaceSlug) {
    const estimatesHref = `/${locale}/dashboard/${workspaceSlug}/estimates`;

    crumbs.push({
      label: t("estimates"),
      href: estimatesRoute.kind === "detail" ? estimatesHref : undefined,
    });

    if (estimatesRoute.kind === "detail") {
      crumbs.push({
        label:
          detailLabel?.trim() ||
          estimatesRoute.estimateId,
      });
    }

    return crumbs;
  }

  if (pageKey) {
    crumbs.push({ label: t(pageKey) });
  }

  return crumbs;
}
