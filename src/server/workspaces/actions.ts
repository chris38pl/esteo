"use server";

import { revalidatePath } from "next/cache";

import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import {
  isWorkspaceAccessible,
  persistActiveWorkspace,
} from "@/server/workspaces/active-workspace";
import { PermissionError } from "@/server/permissions/errors";

export async function setActiveWorkspaceAction(
  workspaceId: string,
  locale: Locale = "pl",
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await requireAuth(locale);

    if (!(await isWorkspaceAccessible(user.id, workspaceId))) {
      throw new PermissionError("You do not have access to this workspace.");
    }

    await persistActiveWorkspace(user.id, workspaceId);
    revalidatePath(`/${locale}/dashboard`);

    return { success: true };
  } catch (error) {
    if (error instanceof PermissionError) {
      return { success: false, error: error.message };
    }

    console.error(error);
    return { success: false, error: "Something went wrong." };
  }
}
