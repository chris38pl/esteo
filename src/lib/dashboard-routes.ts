import type { Locale } from "@/lib/locale";

export function dashboardAccountHref(locale: Locale) {
  return `/${locale}/dashboard/account`;
}

export function dashboardAccountBillingTabHref(locale: Locale) {
  return `/${locale}/dashboard/account?tab=billing`;
}

/**
 * Workspace billing lives at `/dashboard/{slug}/billing`.
 * Never link to the legacy `/dashboard/billing` path from the client — soft navigation
 * there cannot hit the HTTP redirect route handler reliably.
 */
export function dashboardBillingHref(locale: Locale, workspaceSlug: string) {
  return `/${locale}/dashboard/${workspaceSlug}/billing`;
}

export function dashboardBillingManageHref(locale: Locale, workspaceSlug: string) {
  return `/${locale}/dashboard/${workspaceSlug}/billing/manage`;
}

/** @deprecated Use dashboardBillingManageHref */
export function dashboardBillingPlansHref(locale: Locale, workspaceSlug: string) {
  return dashboardBillingManageHref(locale, workspaceSlug);
}

/** @deprecated Use dashboardBillingManageHref */
export function dashboardBillingAddonsHref(locale: Locale, workspaceSlug: string) {
  return dashboardBillingManageHref(locale, workspaceSlug);
}

export function dashboardWorkspaceUsageHref(locale: Locale, workspaceSlug: string) {
  return `/${locale}/dashboard/${workspaceSlug}/workspace-usage`;
}

/** Alias route — redirects to `/billing/manage`. Use for upgrade CTAs. */
export function dashboardUpgradeHref(
  locale: Locale,
  workspaceSlug: string,
  options?: { plan?: "PRO" | "BUSINESS" },
) {
  const base = `/${locale}/dashboard/${workspaceSlug}/upgrade`;
  if (!options?.plan) {
    return base;
  }
  return `${base}?plan=${options.plan}`;
}

/** Returns a billing href for the first owned workspace, or null when the user is not an owner. */
export function ownedWorkspaceBillingHref(
  locale: Locale,
  workspaces: ReadonlyArray<{ slug: string; isOwner: boolean }>,
): string | null {
  const owned = workspaces.find((workspace) => workspace.isOwner);
  return owned ? dashboardBillingHref(locale, owned.slug) : null;
}
