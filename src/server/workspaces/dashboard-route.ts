import { redirect } from "next/navigation";
import type { User } from "@prisma/client";

import { hasPendingInboxItems } from "@/features/workspaces/server/inbox-state";
import { countAccessibleWorkspaces } from "@/features/workspaces/server/accessible-workspaces";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import {
  canUserCreateWorkspace,
  countOwnedWorkspaces,
} from "@/server/permissions/entitlements";
import { PermissionError } from "@/server/permissions/errors";
import { requireRole } from "@/server/permissions/require-workspace";

export type DashboardAccessState = {
  accessibleCount: number;
  hasPendingInbox: boolean;
};

/** Result returned by check* guards: user + optional redirect URL (never throws). */
export type AccessCheckResult = { user: User; redirectTo: string | null };

export async function getDashboardAccessState(user: User): Promise<DashboardAccessState> {
  const accessibleCount = await countAccessibleWorkspaces(user.id);
  const hasPendingInbox =
    accessibleCount === 0 ? await hasPendingInboxItems(user.email) : false;

  return { accessibleCount, hasPendingInbox };
}

function dashboardPath(locale: Locale): string {
  return `/${locale}/dashboard`;
}

function onboardingPath(locale: Locale): string {
  return `/${locale}/dashboard/onboarding`;
}

function incomingInvitationsPath(locale: Locale): string {
  return `/${locale}/dashboard/invitations`;
}

function newWorkspacePath(locale: Locale): string {
  return `/${locale}/dashboard/workspaces/new`;
}

function workspaceSettingsPath(locale: Locale, workspaceSlug: string): string {
  return `/${locale}/dashboard/${workspaceSlug}/settings`;
}

/**
 * Returns the URL to redirect to when the user has no accessible workspaces,
 * or null if they have at least one. Does NOT throw - safe to use in layouts
 * that render <ClientRedirect> instead of calling redirect().
 */
async function resolveNoAccessUrl(locale: Locale, user: User): Promise<string | null> {
  const { accessibleCount, hasPendingInbox } = await getDashboardAccessState(user);

  if (accessibleCount === 0) {
    return hasPendingInbox ? incomingInvitationsPath(locale) : onboardingPath(locale);
  }

  return null;
}

// ─── Non-throwing check guards ───────────────────────────────────────────────
//
// These return { user, redirectTo } instead of calling redirect(). Use them in
// layout components that render <ClientRedirect href={redirectTo} /> so that
// redirects work reliably during both full-page loads and client-side (RSC)
// navigations. Server redirect() can stall when called from a nested layout
// during a soft navigation - ClientRedirect's useLayoutEffect is always reliable.

/** Guard for /dashboard (main app) - requires at least one accessible workspace. */
export async function checkDashboardHomeAccess(locale: Locale): Promise<AccessCheckResult> {
  const user = await requireAuth(locale);
  const redirectTo = await resolveNoAccessUrl(locale, user);
  return { user, redirectTo };
}

/** Guard for /dashboard/onboarding - founders only, not invitees with pending invites. */
export async function checkOnboardingAccess(locale: Locale): Promise<AccessCheckResult> {
  const user = await requireAuth(locale);
  const { accessibleCount, hasPendingInbox } = await getDashboardAccessState(user);

  if (accessibleCount > 0) return { user, redirectTo: dashboardPath(locale) };
  if (hasPendingInbox) return { user, redirectTo: incomingInvitationsPath(locale) };

  return { user, redirectTo: null };
}

/** Guard for /dashboard/invitations - users with pending inbox items (invites or transfers). */
export async function checkIncomingInvitationsAccess(locale: Locale): Promise<AccessCheckResult> {
  const user = await requireAuth(locale);
  const [accessibleCount, hasInbox] = await Promise.all([
    countAccessibleWorkspaces(user.id),
    hasPendingInboxItems(user.email),
  ]);

  if (!hasInbox) {
    return {
      user,
      redirectTo: accessibleCount > 0 ? dashboardPath(locale) : onboardingPath(locale),
    };
  }

  return { user, redirectTo: null };
}

/** Guard for /dashboard/workspaces/new - owners who can create another workspace. */
export async function checkNewWorkspaceAccess(locale: Locale): Promise<AccessCheckResult> {
  const user = await requireAuth(locale);
  const noAccessUrl = await resolveNoAccessUrl(locale, user);
  if (noAccessUrl) return { user, redirectTo: noAccessUrl };

  const [canCreate, ownedCount] = await Promise.all([
    canUserCreateWorkspace(user.id),
    countOwnedWorkspaces(user.id),
  ]);

  if (!canCreate || ownedCount === 0) return { user, redirectTo: dashboardPath(locale) };

  return { user, redirectTo: null };
}

// ─── Legacy throwing guards (kept for reference) ─────────────────────────────
//
// These call redirect() directly. Prefer the check* variants above in layouts.

/** @deprecated Use checkDashboardHomeAccess in layouts. */
export async function assertDashboardHomeAccess(locale: Locale): Promise<User> {
  const { user, redirectTo } = await checkDashboardHomeAccess(locale);
  if (redirectTo) redirect(redirectTo);
  return user;
}

/** @deprecated Use checkOnboardingAccess in layouts. */
export async function assertOnboardingAccess(locale: Locale): Promise<User> {
  const { user, redirectTo } = await checkOnboardingAccess(locale);
  if (redirectTo) redirect(redirectTo);
  return user;
}

/** @deprecated Use checkIncomingInvitationsAccess in layouts. */
export async function assertIncomingInvitationsAccess(locale: Locale): Promise<User> {
  const { user, redirectTo } = await checkIncomingInvitationsAccess(locale);
  if (redirectTo) redirect(redirectTo);
  return user;
}

/** @deprecated Redirects to invitations hub. */
export async function assertPendingAccessAccess(locale: Locale): Promise<User> {
  const user = await requireAuth(locale);
  redirect(incomingInvitationsPath(locale));
  return user;
}

/** @deprecated Use checkNewWorkspaceAccess in layouts. */
export async function assertNewWorkspaceAccess(locale: Locale): Promise<User> {
  const { user, redirectTo } = await checkNewWorkspaceAccess(locale);
  if (redirectTo) redirect(redirectTo);
  return user;
}

export { incomingInvitationsPath, newWorkspacePath, onboardingPath, workspaceSettingsPath };
