import { redirect } from "next/navigation";
import type { User } from "@prisma/client";

import { hasPendingInvitations } from "@/features/workspaces/server/invitation-inbox";
import { countAccessibleWorkspaces } from "@/features/workspaces/server/accessible-workspaces";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import {
  canUserCreateWorkspace,
  countOwnedWorkspaces,
} from "@/server/permissions/entitlements";
import { PermissionError } from "@/server/permissions/errors";
import { requireRole } from "@/server/permissions/require-workspace";
import { resolveActiveWorkspace } from "@/server/workspaces/active-workspace";

export type DashboardAccessState = {
  accessibleCount: number;
  hasPendingInvites: boolean;
};

export async function getDashboardAccessState(user: User): Promise<DashboardAccessState> {
  const accessibleCount = await countAccessibleWorkspaces(user.id);
  const pendingInvites =
    accessibleCount === 0 ? await hasPendingInvitations(user.email) : false;

  return { accessibleCount, hasPendingInvites: pendingInvites };
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

function workspaceSettingsPath(locale: Locale): string {
  return `/${locale}/dashboard/workspaces/settings`;
}

async function redirectWhenNoAccessibleWorkspaces(
  locale: Locale,
  user: User,
): Promise<void> {
  const { accessibleCount, hasPendingInvites } = await getDashboardAccessState(user);

  if (accessibleCount === 0) {
    redirect(hasPendingInvites ? incomingInvitationsPath(locale) : onboardingPath(locale));
  }
}

/** Guard for /dashboard (main app) — requires at least one accessible workspace. */
export async function assertDashboardHomeAccess(locale: Locale): Promise<User> {
  const user = await requireAuth(locale);
  await redirectWhenNoAccessibleWorkspaces(locale, user);
  return user;
}

/** Guard for /dashboard/onboarding — founders only, not invitees with pending invites. */
export async function assertOnboardingAccess(locale: Locale): Promise<User> {
  const user = await requireAuth(locale);
  const { accessibleCount, hasPendingInvites } = await getDashboardAccessState(user);

  if (accessibleCount > 0) {
    redirect(dashboardPath(locale));
  }

  if (hasPendingInvites) {
    redirect(incomingInvitationsPath(locale));
  }

  return user;
}

/** Guard for /dashboard/invitations — users with pending invites and no accessible workspace. */
export async function assertIncomingInvitationsAccess(locale: Locale): Promise<User> {
  const user = await requireAuth(locale);
  const { accessibleCount, hasPendingInvites } = await getDashboardAccessState(user);

  if (accessibleCount > 0) {
    redirect(dashboardPath(locale));
  }

  if (!hasPendingInvites) {
    redirect(onboardingPath(locale));
  }

  return user;
}

/** @deprecated Redirects to invitations hub. */
export async function assertPendingAccessAccess(locale: Locale): Promise<User> {
  const user = await requireAuth(locale);
  redirect(incomingInvitationsPath(locale));
  return user;
}

/** Guard for /dashboard/workspaces/new — owners who can create another workspace. */
export async function assertNewWorkspaceAccess(locale: Locale): Promise<User> {
  const user = await requireAuth(locale);
  await redirectWhenNoAccessibleWorkspaces(locale, user);

  const [canCreate, ownedCount] = await Promise.all([
    canUserCreateWorkspace(user.id),
    countOwnedWorkspaces(user.id),
  ]);

  if (!canCreate || ownedCount === 0) {
    redirect(dashboardPath(locale));
  }

  return user;
}

/** Guard for /dashboard/workspaces/settings — active workspace owners only. */
export async function assertWorkspaceSettingsAccess(locale: Locale): Promise<User> {
  const user = await requireAuth(locale);
  await redirectWhenNoAccessibleWorkspaces(locale, user);

  const activeWorkspaceId = await resolveActiveWorkspace(user.id);

  if (!activeWorkspaceId) {
    redirect(dashboardPath(locale));
  }

  try {
    await requireRole(user, activeWorkspaceId, "OWNER");
  } catch (error) {
    if (error instanceof PermissionError) {
      redirect(dashboardPath(locale));
    }
    throw error;
  }

  return user;
}

export { incomingInvitationsPath, newWorkspacePath, workspaceSettingsPath };
