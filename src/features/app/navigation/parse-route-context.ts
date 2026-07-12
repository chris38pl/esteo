import { RESERVED_DASHBOARD_SLUGS } from "@/features/workspaces/server/slug-availability";
import { isLocale, type Locale } from "@/lib/locale";

/** Top-level segments under /dashboard that are not workspace slugs. */
const DASHBOARD_TOP_LEVEL_SEGMENTS = new Set([
  ...RESERVED_DASHBOARD_SLUGS,
  "qa",
  "transfer",
]);

export type AuthKind = "sign-in" | "sign-up";

export type RouteMatchContext = {
  locale: Locale;
  pathname: string;
  searchTab: string | null;
  isAuth: boolean;
  authKind: AuthKind | null;
  /** e.g. forgot-password under sign-in */
  authSegment: string | null;
  isDashboard: boolean;
  isAdmin: boolean;
  isQa: boolean;
  workspaceSlug: string | null;
  isWorkspaceRoute: boolean;
  /** First segment after /dashboard/ when not admin/qa/top-level */
  section: string | null;
  entityId: string | null;
  /** e.g. templates under configuration */
  subSection: string | null;
  subEntityId: string | null;
  /** Path after /dashboard/admin/ joined */
  adminTail: string | null;
  /** Path after /dashboard/qa/ joined */
  qaTail: string | null;
  /** Top-level dashboard page id: onboarding, account, invitations, … */
  topLevelPage: string | null;
};

function readSearchTab(
  searchParams?: Record<string, string | string[] | undefined>,
): string | null {
  const tab = searchParams?.tab;
  return typeof tab === "string" && tab.length > 0 ? tab : null;
}

function isWorkspaceSlug(segment: string | undefined): segment is string {
  return Boolean(segment && !DASHBOARD_TOP_LEVEL_SEGMENTS.has(segment));
}

export function parseRouteContext(
  pathname: string,
  searchParams?: Record<string, string | string[] | undefined>,
): RouteMatchContext | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  const localeRaw = segments[0];
  if (!isLocale(localeRaw)) {
    return null;
  }

  const locale = localeRaw;
  const searchTab = readSearchTab(searchParams);
  const base = {
    locale,
    pathname,
    searchTab,
  };

  if (segments[1] === "sign-in") {
    return {
      ...base,
      isAuth: true,
      authKind: "sign-in",
      authSegment: segments[2] ?? null,
      isDashboard: false,
      isAdmin: false,
      isQa: false,
      workspaceSlug: null,
      isWorkspaceRoute: false,
      section: null,
      entityId: null,
      subSection: null,
      subEntityId: null,
      adminTail: null,
      qaTail: null,
      topLevelPage: null,
    };
  }

  if (segments[1] === "sign-up") {
    return {
      ...base,
      isAuth: true,
      authKind: "sign-up",
      authSegment: segments[2] ?? null,
      isDashboard: false,
      isAdmin: false,
      isQa: false,
      workspaceSlug: null,
      isWorkspaceRoute: false,
      section: null,
      entityId: null,
      subSection: null,
      subEntityId: null,
      adminTail: null,
      qaTail: null,
      topLevelPage: null,
    };
  }

  if (segments[1] !== "dashboard") {
    return null;
  }

  const afterDashboard = segments.slice(2);

  if (afterDashboard.length === 0) {
    return {
      ...base,
      isAuth: false,
      authKind: null,
      authSegment: null,
      isDashboard: true,
      isAdmin: false,
      isQa: false,
      workspaceSlug: null,
      isWorkspaceRoute: false,
      section: null,
      entityId: null,
      subSection: null,
      subEntityId: null,
      adminTail: null,
      qaTail: null,
      topLevelPage: null,
    };
  }

  const head = afterDashboard[0];

  if (head === "admin") {
    return {
      ...base,
      isAuth: false,
      authKind: null,
      authSegment: null,
      isDashboard: true,
      isAdmin: true,
      isQa: false,
      workspaceSlug: null,
      isWorkspaceRoute: false,
      section: null,
      entityId: null,
      subSection: null,
      subEntityId: null,
      adminTail: afterDashboard.slice(1).join("/") || null,
      qaTail: null,
      topLevelPage: null,
    };
  }

  if (head === "qa") {
    return {
      ...base,
      isAuth: false,
      authKind: null,
      authSegment: null,
      isDashboard: true,
      isAdmin: false,
      isQa: true,
      workspaceSlug: null,
      isWorkspaceRoute: false,
      section: null,
      entityId: null,
      subSection: null,
      subEntityId: null,
      adminTail: null,
      qaTail: afterDashboard.slice(1).join("/") || null,
      topLevelPage: null,
    };
  }

  if (!isWorkspaceSlug(head)) {
    const topLevelPage =
      head === "workspaces" && afterDashboard[1] === "new"
        ? "workspaces/new"
        : head === "invitations" && afterDashboard[1]
          ? "invitations/detail"
          : head === "transfer" && afterDashboard[1]
            ? "transfer"
            : head;

    return {
      ...base,
      isAuth: false,
      authKind: null,
      authSegment: null,
      isDashboard: true,
      isAdmin: false,
      isQa: false,
      workspaceSlug: null,
      isWorkspaceRoute: false,
      section: null,
      entityId: null,
      subSection: null,
      subEntityId: null,
      adminTail: null,
      qaTail: null,
      topLevelPage,
    };
  }

  const workspaceSlug = head;
  const wsRest = afterDashboard.slice(1);

  if (wsRest.length === 0) {
    return {
      ...base,
      isAuth: false,
      authKind: null,
      authSegment: null,
      isDashboard: true,
      isAdmin: false,
      isQa: false,
      workspaceSlug,
      isWorkspaceRoute: true,
      section: null,
      entityId: null,
      subSection: null,
      subEntityId: null,
      adminTail: null,
      qaTail: null,
      topLevelPage: null,
    };
  }

  const section = wsRest[0];
  const entityId = wsRest[1] ?? null;

  if (section === "configuration") {
    if (wsRest[1] === "templates") {
      const templateSegment = wsRest[2] ?? null;
      return {
        ...base,
        isAuth: false,
        authKind: null,
        authSegment: null,
        isDashboard: true,
        isAdmin: false,
        isQa: false,
        workspaceSlug,
        isWorkspaceRoute: true,
        section,
        entityId: null,
        subSection: "templates",
        subEntityId: templateSegment,
        adminTail: null,
        qaTail: null,
        topLevelPage: null,
      };
    }

    return {
      ...base,
      isAuth: false,
      authKind: null,
      authSegment: null,
      isDashboard: true,
      isAdmin: false,
      isQa: false,
      workspaceSlug,
      isWorkspaceRoute: true,
      section,
      entityId: null,
      subSection: null,
      subEntityId: null,
      adminTail: null,
      qaTail: null,
      topLevelPage: null,
    };
  }

  if (section === "billing") {
    return {
      ...base,
      isAuth: false,
      authKind: null,
      authSegment: null,
      isDashboard: true,
      isAdmin: false,
      isQa: false,
      workspaceSlug,
      isWorkspaceRoute: true,
      section,
      entityId: null,
      subSection: wsRest[1] ?? null,
      subEntityId: null,
      adminTail: null,
      qaTail: null,
      topLevelPage: null,
    };
  }

  return {
    ...base,
    isAuth: false,
    authKind: null,
    authSegment: null,
    isDashboard: true,
    isAdmin: false,
    isQa: false,
    workspaceSlug,
    isWorkspaceRoute: true,
    section,
    entityId,
    subSection: null,
    subEntityId: null,
    adminTail: null,
    qaTail: null,
    topLevelPage: null,
  };
}
