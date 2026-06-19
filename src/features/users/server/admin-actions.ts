"use server";

import { revalidatePath } from "next/cache";

import {
  adminSetUserPlatformRole,
  type AssignablePlatformRole,
} from "@/features/users/server/admin-users";
import type { Locale } from "@/lib/locale";
import { assertPlatformAdminAccess } from "@/server/auth/require-platform-admin";
import { PermissionError } from "@/server/permissions/errors";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof PermissionError) {
    return { success: false, error: error.message };
  }

  console.error(error);
  return { success: false, error: "Something went wrong." };
}

function revalidateAdminUsers(locale: Locale) {
  revalidatePath(`/${locale}/dashboard/admin/users`);
}

export async function adminSetUserPlatformRoleAction(
  userId: string,
  role: AssignablePlatformRole,
  locale: Locale = "pl",
): Promise<ActionResult<{ platformRole: AssignablePlatformRole }>> {
  try {
    const admin = await assertPlatformAdminAccess(locale);
    const updated = await adminSetUserPlatformRole(admin, userId, role);
    revalidateAdminUsers(locale);
    return {
      success: true,
      data: {
        platformRole:
          updated.platformRole === "QA_TESTER" ? "QA_TESTER" : "NONE",
      },
    };
  } catch (error) {
    return toActionError(error);
  }
}
