import type { Locale } from "@/lib/locale";

export function dashboardAccountHref(locale: Locale) {
  return `/${locale}/dashboard/account`;
}

/**
 * Workspace billing lives at `/dashboard/{slug}/billing`.
 * Never link to the legacy `/dashboard/billing` path from the client — soft navigation
 * there cannot hit the HTTP redirect route handler reliably.
 */
export function dashboardBillingHref(locale: Locale, workspaceSlug: string) {
  return `/${locale}/dashboard/${workspaceSlug}/billing`;
}

export function dashboardBillingPlansHref(locale: Locale, workspaceSlug: string) {
  return `/${locale}/dashboard/${workspaceSlug}/billing/plans`;
}

/** Alias route — redirects to `/billing/plans`. Use for upgrade CTAs. */
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
