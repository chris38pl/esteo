"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { useDashboardBreadcrumbDetail } from "@/components/layout/dashboard-top-nav/dashboard-breadcrumb-detail-context";
import type { Locale } from "@/lib/locale";
import { dashboardEstimatesHref } from "@/lib/dashboard-routes";

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
  | "tips"
  | "requests"
  | "accountInspector"
  | "adminUsers"
  | "adminWorkspaces"
  | "adminStorageExplorer"
  | "adminIndustryFields"
  | "adminEstimateRequests"
  | "adminEstimateRequestDetail";

const USER_LEVEL_PAGES = new Set<PageLabelKey>(["account", "billing"]);

type WorkspaceSectionRoute =
  | { kind: "list" }
  | { kind: "detail"; id: string };

function parseWorkspaceSectionRoute(
  pathname: string,
  locale: Locale,
  workspaceSlug: string | null,
  section: "estimates" | "requests" | "payments",
): WorkspaceSectionRoute | null {
  if (!workspaceSlug) {
    return null;
  }

  const base = `/${locale}/dashboard/${workspaceSlug}/${section}`;
  if (pathname === base) {
    return { kind: "list" };
  }

  if (pathname.startsWith(`${base}/`)) {
    const suffix = pathname.slice(base.length + 1);
    const id = suffix.split("/")[0];
    if (id) {
      return { kind: "detail", id };
    }
  }

  return null;
}

function parseEstimatesRoute(
  pathname: string,
  locale: Locale,
  workspaceSlug: string | null,
): WorkspaceSectionRoute | null {
  return parseWorkspaceSectionRoute(pathname, locale, workspaceSlug, "estimates");
}

function parseRequestsRoute(
  pathname: string,
  locale: Locale,
  workspaceSlug: string | null,
): WorkspaceSectionRoute | null {
  return parseWorkspaceSectionRoute(pathname, locale, workspaceSlug, "requests");
}

function parsePaymentsRoute(
  pathname: string,
  locale: Locale,
  workspaceSlug: string | null,
): WorkspaceSectionRoute | null {
  return parseWorkspaceSectionRoute(pathname, locale, workspaceSlug, "payments");
}

function parseAdminIssuesRoute(
  pathname: string,
  locale: Locale,
): { kind: "list" } | { kind: "detail"; number: string } | null {
  const base = `/${locale}/dashboard/admin/issues`;

  if (pathname === base) {
    return { kind: "list" };
  }

  if (pathname.startsWith(`${base}/`)) {
    const suffix = pathname.slice(base.length + 1);
    const number = suffix.split("/")[0];
    if (number) {
      return { kind: "detail", number };
    }
  }

  return null;
}

function parseQaIssuesRoute(
  pathname: string,
  locale: Locale,
): { kind: "list" } | { kind: "detail"; number: string } | null {
  const base = `/${locale}/dashboard/qa/issues`;

  if (pathname === base) {
    return { kind: "list" };
  }

  if (pathname.startsWith(`${base}/`)) {
    const suffix = pathname.slice(base.length + 1);
    const number = suffix.split("/")[0];
    if (number) {
      return { kind: "detail", number };
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
    if (pathname === `${wsBase}/tips`) return "tips";
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
  if (pathname === `${base}/admin/storage`) return "adminStorageExplorer";
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
  const wsBase = workspaceSlug ? `/${locale}/dashboard/${workspaceSlug}` : null;
  const dashboardHref = workspaceSlug
    ? dashboardEstimatesHref(locale, workspaceSlug)
    : `/${locale}/dashboard`;
  const estimatesRoute = parseEstimatesRoute(pathname, locale, workspaceSlug);
  const requestsRoute = parseRequestsRoute(pathname, locale, workspaceSlug);
  const paymentsRoute = parsePaymentsRoute(pathname, locale, workspaceSlug);
  const adminIssuesRoute = parseAdminIssuesRoute(pathname, locale);
  const qaIssuesRoute = parseQaIssuesRoute(pathname, locale);
  const pageKey = resolvePageLabelKey(pathname, locale, section, workspaceSlug);
  const isAdminPath = pathname.startsWith(`/${locale}/dashboard/admin`);
  const isQaPath = pathname.startsWith(`/${locale}/dashboard/qa`);

  const workspaceLabel = activeWorkspace?.name?.trim() || t("workspace");

  const isUserLevelPage = pageKey !== null && USER_LEVEL_PAGES.has(pageKey);

  const crumbs: BreadcrumbItem[] = [
    { label: t("dashboard"), href: dashboardHref },
  ];

  if (isAdminPath) {
    crumbs.push({ label: t("admin") });
  } else if (isQaPath) {
    crumbs.push({ label: t("qaTesting") });
  } else if (!isUserLevelPage) {
    crumbs.push({ label: workspaceLabel });
  }

  if (isAdminPath && adminIssuesRoute) {
    const issuesHref = `/${locale}/dashboard/admin/issues`;

    crumbs.push({
      label: t("adminIssues"),
      href: adminIssuesRoute.kind === "detail" ? issuesHref : undefined,
    });

    if (adminIssuesRoute.kind === "detail") {
      crumbs.push({
        label: detailLabel?.trim() || `#${adminIssuesRoute.number}`,
      });
    }

    return crumbs;
  }

  if (isQaPath && qaIssuesRoute) {
    const issuesHref = `/${locale}/dashboard/qa/issues`;

    crumbs.push({
      label: t("qaIssues"),
      href: qaIssuesRoute.kind === "detail" ? issuesHref : undefined,
    });

    if (qaIssuesRoute.kind === "detail") {
      crumbs.push({
        label: detailLabel?.trim() || `#${qaIssuesRoute.number}`,
      });
    }

    return crumbs;
  }

  if (estimatesRoute && workspaceSlug) {
    const estimatesHref = `/${locale}/dashboard/${workspaceSlug}/estimates`;

    crumbs.push({
      label: t("estimates"),
      href: estimatesRoute.kind === "detail" ? estimatesHref : undefined,
    });

    if (estimatesRoute.kind === "detail") {
      crumbs.push({
        label: detailLabel?.trim() || estimatesRoute.id,
      });
    }

    return crumbs;
  }

  if (requestsRoute && workspaceSlug) {
    const requestsHref = `/${locale}/dashboard/${workspaceSlug}/requests`;

    crumbs.push({
      label: t("requests"),
      href: requestsRoute.kind === "detail" ? requestsHref : undefined,
    });

    if (requestsRoute.kind === "detail") {
      crumbs.push({
        label: detailLabel?.trim() || requestsRoute.id,
      });
    }

    return crumbs;
  }

  if (paymentsRoute && workspaceSlug) {
    crumbs.push({
      label: t("payments"),
    });

    return crumbs;
  }

  if (wsBase && pathname === `${wsBase}/billing/manage`) {
    crumbs.push({
      label: t("billing"),
      href: `${wsBase}/billing`,
    });
    crumbs.push({ label: t("billingManage") });
    return crumbs;
  }

  if (wsBase && pathname === `${wsBase}/billing/plans`) {
    crumbs.push({
      label: t("billing"),
      href: `${wsBase}/billing`,
    });
    crumbs.push({ label: t("billingManage") });
    return crumbs;
  }

  if (wsBase && pathname === `${wsBase}/billing/addons`) {
    crumbs.push({
      label: t("billing"),
      href: `${wsBase}/billing`,
    });
    crumbs.push({ label: t("billingManage") });
    return crumbs;
  }

  if (pageKey) {
    crumbs.push({ label: t(pageKey) });
  }

  return crumbs;
}
