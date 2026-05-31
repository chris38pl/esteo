"use server";

import type { WorkspaceAppearanceTheme } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { updateWorkspaceAppearance } from "@/features/workspaces/server/service";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
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

export async function updateWorkspaceAppearanceAction(
  workspaceId: string,
  appearanceTheme: WorkspaceAppearanceTheme,
  locale: Locale = "pl",
): Promise<ActionResult<Awaited<ReturnType<typeof updateWorkspaceAppearance>>>> {
  try {
    const user = await requireAuth(locale);
    const workspace = await updateWorkspaceAppearance(user, workspaceId, appearanceTheme);

    revalidatePath(`/${locale}/dashboard`);

    return { success: true, data: workspace };
  } catch (error) {
    return toActionError(error);
  }
}
