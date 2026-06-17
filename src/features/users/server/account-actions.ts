"use server";

import { deleteUserAccount } from "@/features/users/server/delete-user-account";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { EntitlementError, PermissionError } from "@/server/permissions/errors";

type DeleteUserAccountResult =
  | { success: true }
  | { success: false; error: string; code?: string };

export async function deleteUserAccountAction(
  locale: Locale,
): Promise<DeleteUserAccountResult> {
  try {
    const user = await requireAuth(locale);
    await deleteUserAccount(user);
    return { success: true };
  } catch (error) {
    if (error instanceof EntitlementError) {
      return { success: false, error: error.message, code: error.code };
    }

    if (error instanceof PermissionError) {
      return { success: false, error: error.message };
    }

    if (error instanceof Error) {
      console.error("deleteUserAccountAction failed:", error);
      return { success: false, error: error.message };
    }

    console.error("deleteUserAccountAction failed:", error);
    return { success: false, error: "Something went wrong." };
  }
}
