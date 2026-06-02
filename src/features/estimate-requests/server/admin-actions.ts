"use server";

import { revalidatePath } from "next/cache";

import { adminArchiveEstimateRequest } from "@/features/estimate-requests/server/admin-estimate-requests";
import type { Locale } from "@/lib/locale";
import { assertPlatformAdminAccess } from "@/server/auth/require-platform-admin";
import { PermissionError } from "@/server/permissions/errors";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof PermissionError) {
    return { success: false, error: error.message };
  }

  console.error(error);
  return { success: false, error: "Something went wrong." };
}

function revalidateAdminEstimateRequests(locale: Locale) {
  revalidatePath(`/${locale}/dashboard/admin/estimate-requests`);
}

export async function adminArchiveEstimateRequestAction(
  requestId: string,
  locale: Locale = "pl",
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await assertPlatformAdminAccess(locale);
    const request = await adminArchiveEstimateRequest(admin, requestId);
    revalidateAdminEstimateRequests(locale);
    return { success: true, data: request };
  } catch (error) {
    return toActionError(error);
  }
}

