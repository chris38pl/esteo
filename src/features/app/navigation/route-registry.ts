import type { RouteMatchContext } from "@/features/app/navigation/parse-route-context";

export type TitleFormat = "plain" | "workspace" | "entity";

export type RouteCategory =
  | "navigation"
  | "entity"
  | "settings"
  | "admin"
  | "qa"
  | "auth"
  | "public";

export type DynamicEntity =
  | "estimate"
  | "request"
  | "issue"
  | "opsCase"
  | "template"
  | "adminRequest";

export type AppRouteEntry = {
  id: string;
  match: (ctx: RouteMatchContext) => boolean;
  /** i18n key: "namespace.rest.of.key" */
  titleKey: string;
  breadcrumbKey?: string;
  titleFormat?: TitleFormat;
  routeCategory: RouteCategory;
  dynamicEntity?: DynamicEntity;
  tabTitleKeys?: Record<string, string>;
  sidebarNavId?: string;
};

const SETTINGS_TAB_TITLE_KEYS: Record<string, string> = {
  users: "workspaces.settings.tabs.users",
  company: "workspaces.settings.tabs.company",
  referral: "workspaces.settings.tabs.referral",
  integrations: "workspaces.settings.tabs.integrations",
  rules: "workspaces.settings.tabs.rules",
  general: "workspaces.settings.tabs.general",
};

/**
 * Ordered registry — first match wins. More specific routes must appear first.
 */
export const APP_ROUTE_REGISTRY: AppRouteEntry[] = [
  // Auth
  {
    id: "auth.sign-in.forgot-password",
    match: (ctx) => ctx.isAuth && ctx.authKind === "sign-in" && ctx.authSegment === "forgot-password",
    titleKey: "auth.forgotPassword.title",
    titleFormat: "plain",
    routeCategory: "auth",
  },
  {
    id: "auth.sign-in",
    match: (ctx) => ctx.isAuth && ctx.authKind === "sign-in",
    titleKey: "auth.signIn.documentTitle",
    titleFormat: "plain",
    routeCategory: "auth",
  },
  {
    id: "auth.sign-up",
    match: (ctx) => ctx.isAuth && ctx.authKind === "sign-up",
    titleKey: "auth.signUp.documentTitle",
    titleFormat: "plain",
    routeCategory: "auth",
  },

  // Admin entity details
  {
    id: "admin.estimate-request.detail",
    match: (ctx) => ctx.isAdmin && /^estimate-requests\/.+/.test(ctx.adminTail ?? ""),
    titleKey: "admin.estimateRequests.title",
    titleFormat: "plain",
    routeCategory: "entity",
    dynamicEntity: "adminRequest",
    breadcrumbKey: "navbar.breadcrumbs.adminEstimateRequestDetail",
  },
  {
    id: "admin.issue.detail",
    match: (ctx) => ctx.isAdmin && /^issues\/.+/.test(ctx.adminTail ?? ""),
    titleKey: "issues.admin.title",
    titleFormat: "plain",
    routeCategory: "entity",
    dynamicEntity: "issue",
    breadcrumbKey: "navbar.breadcrumbs.adminIssues",
  },
  {
    id: "admin.ops-case.detail",
    match: (ctx) => ctx.isAdmin && /^ops-cases\/.+/.test(ctx.adminTail ?? ""),
    titleKey: "ops-cases.admin.title",
    titleFormat: "plain",
    routeCategory: "entity",
    dynamicEntity: "opsCase",
    breadcrumbKey: "navbar.breadcrumbs.adminOpsCases",
  },

  // QA entity detail
  {
    id: "qa.issue.detail",
    match: (ctx) => ctx.isQa && /^issues\/.+/.test(ctx.qaTail ?? ""),
    titleKey: "navbar.breadcrumbs.qaIssues",
    titleFormat: "plain",
    routeCategory: "entity",
    dynamicEntity: "issue",
    breadcrumbKey: "navbar.breadcrumbs.qaIssues",
  },

  // Workspace entity details
  {
    id: "workspace.estimate.detail",
    match: (ctx) => ctx.isWorkspaceRoute && ctx.section === "estimates" && Boolean(ctx.entityId),
    titleKey: "estimates.editor.untitled",
    titleFormat: "entity",
    routeCategory: "entity",
    dynamicEntity: "estimate",
    breadcrumbKey: "navbar.breadcrumbs.estimates",
  },
  {
    id: "workspace.request.detail",
    match: (ctx) => ctx.isWorkspaceRoute && ctx.section === "requests" && Boolean(ctx.entityId),
    titleKey: "requests.list.noRequestNumber",
    titleFormat: "entity",
    routeCategory: "entity",
    dynamicEntity: "request",
    breadcrumbKey: "navbar.breadcrumbs.requests",
  },
  {
    id: "workspace.configuration.template.new",
    match: (ctx) =>
      ctx.isWorkspaceRoute &&
      ctx.section === "configuration" &&
      ctx.subSection === "templates" &&
      ctx.subEntityId === "new",
    titleKey: "navbar.breadcrumbs.configurationNewTemplate",
    titleFormat: "plain",
    routeCategory: "navigation",
    breadcrumbKey: "navbar.breadcrumbs.configuration",
  },
  {
    id: "workspace.configuration.template.detail",
    match: (ctx) =>
      ctx.isWorkspaceRoute &&
      ctx.section === "configuration" &&
      ctx.subSection === "templates" &&
      Boolean(ctx.subEntityId) &&
      ctx.subEntityId !== "new",
    titleKey: "workspaces.configuration.templates.editor.pageTitle",
    titleFormat: "entity",
    routeCategory: "entity",
    dynamicEntity: "template",
    breadcrumbKey: "navbar.breadcrumbs.configurationTemplates",
  },

  // Workspace settings & billing (workspace title format)
  {
    id: "workspace.settings",
    match: (ctx) => ctx.isWorkspaceRoute && ctx.section === "settings",
    titleKey: "workspaces.settings.title",
    tabTitleKeys: SETTINGS_TAB_TITLE_KEYS,
    titleFormat: "workspace",
    routeCategory: "settings",
    breadcrumbKey: "navbar.breadcrumbs.settings",
  },
  {
    id: "workspace.billing.manage",
    match: (ctx) => ctx.isWorkspaceRoute && ctx.section === "billing" && ctx.subSection === "manage",
    titleKey: "navbar.breadcrumbs.billingManage",
    titleFormat: "workspace",
    routeCategory: "settings",
    breadcrumbKey: "navbar.breadcrumbs.billing",
  },
  {
    id: "workspace.billing.plans",
    match: (ctx) => ctx.isWorkspaceRoute && ctx.section === "billing" && ctx.subSection === "plans",
    titleKey: "navbar.breadcrumbs.billingPlans",
    titleFormat: "workspace",
    routeCategory: "settings",
    breadcrumbKey: "navbar.breadcrumbs.billing",
  },
  {
    id: "workspace.billing.addons",
    match: (ctx) => ctx.isWorkspaceRoute && ctx.section === "billing" && ctx.subSection === "addons",
    titleKey: "navbar.breadcrumbs.billingAddons",
    titleFormat: "workspace",
    routeCategory: "settings",
    breadcrumbKey: "navbar.breadcrumbs.billing",
  },
  {
    id: "workspace.billing",
    match: (ctx) => ctx.isWorkspaceRoute && ctx.section === "billing",
    titleKey: "billing.title",
    titleFormat: "workspace",
    routeCategory: "settings",
    breadcrumbKey: "navbar.breadcrumbs.billing",
  },

  // Workspace navigation lists
  {
    id: "workspace.home",
    match: (ctx) => ctx.isWorkspaceRoute && !ctx.section,
    titleKey: "dashboard.title",
    titleFormat: "plain",
    routeCategory: "navigation",
    breadcrumbKey: "navbar.breadcrumbs.dashboard",
  },
  {
    id: "workspace.estimates.list",
    match: (ctx) => ctx.isWorkspaceRoute && ctx.section === "estimates",
    titleKey: "estimates.page.title",
    titleFormat: "plain",
    routeCategory: "navigation",
    breadcrumbKey: "navbar.breadcrumbs.estimates",
    sidebarNavId: "estimates",
  },
  {
    id: "workspace.requests.list",
    match: (ctx) => ctx.isWorkspaceRoute && ctx.section === "requests",
    titleKey: "requests.page.title",
    titleFormat: "plain",
    routeCategory: "navigation",
    breadcrumbKey: "navbar.breadcrumbs.requests",
    sidebarNavId: "requests",
  },
  {
    id: "workspace.payments",
    match: (ctx) => ctx.isWorkspaceRoute && ctx.section === "payments",
    titleKey: "payments.page.title",
    titleFormat: "plain",
    routeCategory: "navigation",
    breadcrumbKey: "navbar.breadcrumbs.payments",
    sidebarNavId: "payments",
  },
  {
    id: "workspace.configuration",
    match: (ctx) => ctx.isWorkspaceRoute && ctx.section === "configuration",
    titleKey: "navbar.breadcrumbs.configuration",
    tabTitleKeys: {
      templates: "navbar.breadcrumbs.configurationTemplates",
      rules: "navbar.breadcrumbs.configurationRules",
    },
    titleFormat: "plain",
    routeCategory: "navigation",
    breadcrumbKey: "navbar.breadcrumbs.configuration",
  },
  {
    id: "workspace.tips",
    match: (ctx) => ctx.isWorkspaceRoute && ctx.section === "tips",
    titleKey: "tips.page.title",
    titleFormat: "plain",
    routeCategory: "navigation",
    breadcrumbKey: "navbar.breadcrumbs.tips",
  },
  {
    id: "workspace.referrals",
    match: (ctx) => ctx.isWorkspaceRoute && ctx.section === "referrals",
    titleKey: "referrals.title",
    titleFormat: "plain",
    routeCategory: "navigation",
  },
  {
    id: "workspace.workspace-usage",
    match: (ctx) => ctx.isWorkspaceRoute && ctx.section === "workspace-usage",
    titleKey: "workspaceUsage.title",
    titleFormat: "plain",
    routeCategory: "navigation",
  },
  {
    id: "workspace.upgrade",
    match: (ctx) => ctx.isWorkspaceRoute && ctx.section === "upgrade",
    titleKey: "billing.workspace.plans.title",
    titleFormat: "plain",
    routeCategory: "navigation",
  },

  // Top-level dashboard pages
  {
    id: "dashboard.root",
    match: (ctx) =>
      ctx.isDashboard &&
      !ctx.isAdmin &&
      !ctx.isQa &&
      !ctx.isWorkspaceRoute &&
      ctx.topLevelPage === null,
    titleKey: "dashboard.title",
    titleFormat: "plain",
    routeCategory: "navigation",
    breadcrumbKey: "navbar.breadcrumbs.dashboard",
  },
  {
    id: "dashboard.onboarding",
    match: (ctx) => ctx.isDashboard && ctx.topLevelPage === "onboarding",
    titleKey: "navbar.breadcrumbs.onboarding",
    titleFormat: "plain",
    routeCategory: "navigation",
    breadcrumbKey: "navbar.breadcrumbs.onboarding",
  },
  {
    id: "dashboard.account",
    match: (ctx) => ctx.isDashboard && ctx.topLevelPage === "account",
    titleKey: "navbar.breadcrumbs.account",
    titleFormat: "plain",
    routeCategory: "settings",
    breadcrumbKey: "navbar.breadcrumbs.account",
  },
  {
    id: "dashboard.pending-access",
    match: (ctx) => ctx.isDashboard && ctx.topLevelPage === "pending-access",
    titleKey: "navbar.breadcrumbs.pendingAccess",
    titleFormat: "plain",
    routeCategory: "navigation",
    breadcrumbKey: "navbar.breadcrumbs.pendingAccess",
  },
  {
    id: "dashboard.invitations.detail",
    match: (ctx) => ctx.isDashboard && ctx.topLevelPage === "invitations/detail",
    titleKey: "navbar.breadcrumbs.invitations",
    titleFormat: "plain",
    routeCategory: "navigation",
    breadcrumbKey: "navbar.breadcrumbs.invitations",
  },
  {
    id: "dashboard.invitations",
    match: (ctx) => ctx.isDashboard && ctx.topLevelPage === "invitations",
    titleKey: "navbar.breadcrumbs.invitations",
    titleFormat: "plain",
    routeCategory: "navigation",
    breadcrumbKey: "navbar.breadcrumbs.invitations",
  },
  {
    id: "dashboard.workspaces.new",
    match: (ctx) => ctx.isDashboard && ctx.topLevelPage === "workspaces/new",
    titleKey: "navbar.breadcrumbs.newWorkspace",
    titleFormat: "plain",
    routeCategory: "navigation",
    breadcrumbKey: "navbar.breadcrumbs.newWorkspace",
  },
  {
    id: "dashboard.transfer",
    match: (ctx) => ctx.isDashboard && ctx.topLevelPage === "transfer",
    titleKey: "workspaces.transfer.modalTitle",
    titleFormat: "plain",
    routeCategory: "navigation",
  },

  // Admin lists
  {
    id: "admin.account-inspector",
    match: (ctx) => ctx.isAdmin && ctx.adminTail === "account-inspector",
    titleKey: "admin.accountInspector.title",
    titleFormat: "plain",
    routeCategory: "admin",
    breadcrumbKey: "navbar.breadcrumbs.accountInspector",
  },
  {
    id: "admin.users",
    match: (ctx) => ctx.isAdmin && ctx.adminTail === "users",
    titleKey: "admin.users.title",
    titleFormat: "plain",
    routeCategory: "admin",
    breadcrumbKey: "navbar.breadcrumbs.adminUsers",
  },
  {
    id: "admin.workspaces",
    match: (ctx) => ctx.isAdmin && ctx.adminTail === "workspaces",
    titleKey: "admin.workspaces.title",
    titleFormat: "plain",
    routeCategory: "admin",
    breadcrumbKey: "navbar.breadcrumbs.adminWorkspaces",
  },
  {
    id: "admin.storage",
    match: (ctx) => ctx.isAdmin && ctx.adminTail === "storage",
    titleKey: "admin.storageExplorer.title",
    titleFormat: "plain",
    routeCategory: "admin",
    breadcrumbKey: "navbar.breadcrumbs.adminStorageExplorer",
  },
  {
    id: "admin.industry-fields",
    match: (ctx) => ctx.isAdmin && ctx.adminTail === "industry-fields",
    titleKey: "admin.industryFields.title",
    titleFormat: "plain",
    routeCategory: "admin",
    breadcrumbKey: "navbar.breadcrumbs.adminIndustryFields",
  },
  {
    id: "admin.estimate-requests",
    match: (ctx) => ctx.isAdmin && ctx.adminTail === "estimate-requests",
    titleKey: "admin.estimateRequests.title",
    titleFormat: "plain",
    routeCategory: "admin",
    breadcrumbKey: "navbar.breadcrumbs.adminEstimateRequests",
  },
  {
    id: "admin.estimates",
    match: (ctx) => ctx.isAdmin && ctx.adminTail === "estimates",
    titleKey: "admin.estimates.title",
    titleFormat: "plain",
    routeCategory: "admin",
    breadcrumbKey: "navbar.breadcrumbs.adminEstimates",
  },
  {
    id: "admin.issues",
    match: (ctx) => ctx.isAdmin && ctx.adminTail === "issues",
    titleKey: "issues.admin.title",
    titleFormat: "plain",
    routeCategory: "admin",
    breadcrumbKey: "navbar.breadcrumbs.adminIssues",
  },
  {
    id: "admin.ops-cases",
    match: (ctx) => ctx.isAdmin && ctx.adminTail === "ops-cases",
    titleKey: "ops-cases.admin.title",
    titleFormat: "plain",
    routeCategory: "admin",
    breadcrumbKey: "navbar.breadcrumbs.adminOpsCases",
  },
  {
    id: "admin.pdf-preview",
    match: (ctx) => ctx.isAdmin && ctx.adminTail === "pdf-preview",
    titleKey: "admin.pdfPreview.title",
    titleFormat: "plain",
    routeCategory: "admin",
  },
  {
    id: "admin.voice-intake-preview",
    match: (ctx) => ctx.isAdmin && ctx.adminTail === "voice-intake-preview",
    titleKey: "admin.voiceIntakePreview.title",
    titleFormat: "plain",
    routeCategory: "admin",
  },
  {
    id: "admin.activation-preview",
    match: (ctx) => ctx.isAdmin && ctx.adminTail === "activation-preview",
    titleKey: "admin.activationPreview.title",
    titleFormat: "plain",
    routeCategory: "admin",
  },

  // QA list
  {
    id: "qa.issues",
    match: (ctx) => ctx.isQa && ctx.qaTail === "issues",
    titleKey: "navbar.breadcrumbs.qaIssues",
    titleFormat: "plain",
    routeCategory: "qa",
    breadcrumbKey: "navbar.breadcrumbs.qaIssues",
  },
];

export function matchAppRoute(ctx: RouteMatchContext): AppRouteEntry | null {
  return APP_ROUTE_REGISTRY.find((entry) => entry.match(ctx)) ?? null;
}

export function resolveTitleKeyForRoute(
  entry: AppRouteEntry,
  searchTab: string | null,
): string {
  if (searchTab && entry.tabTitleKeys?.[searchTab]) {
    return entry.tabTitleKeys[searchTab];
  }
  return entry.titleKey;
}
