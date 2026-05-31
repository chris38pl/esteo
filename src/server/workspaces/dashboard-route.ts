import { redirect } from "next/navigation";
import type { User } from "@prisma/client";

import { hasSeatBlockedPendingInvite } from "@/features/workspaces/server/auto-accept-invitations";
import { countAccessibleWorkspaces } from "@/features/workspaces/server/accessible-workspaces";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import {
  canUserCreateWorkspace,
  countOwnedWorkspaces,
} from "@/server/permissions/entitlements";

export type DashboardAccessState = {
  accessibleCount: number;
  seatBlocked: boolean;
};

export async function getDashboardAccessState(user: User) {
  const accessibleCount = await countAccessibleWorkspaces(user.id);

  console.log("[GUARD] accessibleCount", accessibleCount);

  const seatBlocked =
    accessibleCount === 0
      ? await hasSeatBlockedPendingInvite(user.email)
      : false;

  console.log("[GUARD] seatBlocked", seatBlocked);

  return { accessibleCount, seatBlocked };
}

function dashboardPath(locale: Locale): string {
  return `/${locale}/dashboard`;
}

function onboardingPath(locale: Locale): string {
  return `/${locale}/dashboard/onboarding`;
}

function pendingAccessPath(locale: Locale): string {
  return `/${locale}/dashboard/pending-access`;
}

function newWorkspacePath(locale: Locale): string {
  return `/${locale}/dashboard/workspaces/new`;
}

/** Guard for /dashboard (main app) — requires at least one accessible workspace. */
export async function assertDashboardHomeAccess(locale: Locale): Promise<User> {
  const user = await requireAuth(locale);
  const { accessibleCount, seatBlocked } = await getDashboardAccessState(user);

  if (accessibleCount === 0) {
    console.log("[GUARD] redirect onboarding");
    redirect(seatBlocked ? pendingAccessPath(locale) : onboardingPath(locale));
  }

  return user;
}

/** Guard for /dashboard/onboarding — founders only, not seat-blocked invitees. */
export async function assertOnboardingAccess(locale: Locale): Promise<User> {
  const user = await requireAuth(locale);
  const { accessibleCount, seatBlocked } = await getDashboardAccessState(user);

  if (accessibleCount > 0) {
    redirect(dashboardPath(locale));
  }

  if (seatBlocked) {
    redirect(pendingAccessPath(locale));
  }

  return user;
}

/** Guard for /dashboard/pending-access — seat-limit blocked invitees only. */
export async function assertPendingAccessAccess(locale: Locale): Promise<User> {
  const user = await requireAuth(locale);
  const { accessibleCount, seatBlocked } = await getDashboardAccessState(user);

  if (accessibleCount > 0) {
    redirect(dashboardPath(locale));
  }

  if (!seatBlocked) {
    redirect(onboardingPath(locale));
  }

  return user;
}

/** Guard for /dashboard/workspaces/new — owners who can create another workspace. */
export async function assertNewWorkspaceAccess(locale: Locale): Promise<User> {
  const user = await requireAuth(locale);
  const { accessibleCount, seatBlocked } = await getDashboardAccessState(user);

  if (accessibleCount === 0) {
    redirect(seatBlocked ? pendingAccessPath(locale) : onboardingPath(locale));
  }

  const [canCreate, ownedCount] = await Promise.all([
    canUserCreateWorkspace(user.id),
    countOwnedWorkspaces(user.id),
  ]);

  if (!canCreate || ownedCount === 0) {
    redirect(dashboardPath(locale));
  }

  return user;
}

export { newWorkspacePath };
