"use server";

import { revalidatePath } from "next/cache";

import {
  adminArchiveWorkspace,
  adminInviteToWorkspace,
  adminUpdateWorkspace,
  listAdminWorkspaces,
} from "@/features/workspaces/server/admin-workspaces";
import type { Locale } from "@/lib/locale";
import { assertPlatformAdminAccess } from "@/server/auth/require-platform-admin";
import { PermissionError, WorkspaceError } from "@/server/permissions/errors";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof PermissionError || error instanceof WorkspaceError) {
    return { success: false, error: error.message };
  }

  console.error(error);
  return { success: false, error: "Something went wrong." };
}

function revalidateAdminWorkspaces(locale: Locale) {
  revalidatePath(`/${locale}/dashboard/admin/workspaces`);
}

export async function listAdminWorkspacesAction(locale: Locale = "pl") {
  try {
    await assertPlatformAdminAccess(locale);
    const workspaces = await listAdminWorkspaces();
    return { success: true as const, data: workspaces };
  } catch (error) {
    return toActionError(error);
  }
}

export async function adminUpdateWorkspaceAction(
  workspaceId: string,
  input: { name: string; slug: string },
  locale: Locale = "pl",
) {
  try {
    const admin = await assertPlatformAdminAccess(locale);
    const workspace = await adminUpdateWorkspace(admin, workspaceId, input);
    revalidateAdminWorkspaces(locale);
    return { success: true as const, data: workspace };
  } catch (error) {
    return toActionError(error);
  }
}

export async function adminArchiveWorkspaceAction(
  workspaceId: string,
  locale: Locale = "pl",
) {
  try {
    const admin = await assertPlatformAdminAccess(locale);
    const workspace = await adminArchiveWorkspace(admin, workspaceId);
    revalidateAdminWorkspaces(locale);
    revalidatePath(`/${locale}/dashboard`);
    return { success: true as const, data: workspace };
  } catch (error) {
    return toActionError(error);
  }
}

export async function adminInviteToWorkspaceAction(
  workspaceId: string,
  email: string,
  locale: Locale = "pl",
) {
  try {
    const admin = await assertPlatformAdminAccess(locale);
    const invitation = await adminInviteToWorkspace(admin, workspaceId, email);
    revalidateAdminWorkspaces(locale);
    return { success: true as const, data: invitation };
  } catch (error) {
    return toActionError(error);
  }
}
