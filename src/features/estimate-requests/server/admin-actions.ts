"use server";

import { revalidatePath } from "next/cache";

import {
  adminArchiveEstimateRequest,
  adminRestoreEstimateRequest,
} from "@/features/estimate-requests/server/admin-estimate-requests";
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

function revalidateWorkspaceEstimatePaths(
  locale: Locale,
  workspaceSlug: string,
  estimateId: string | null,
) {
  revalidatePath(`/${locale}/dashboard/${workspaceSlug}/estimates`);
  revalidatePath(`/${locale}/dashboard/${workspaceSlug}/requests`);

  if (estimateId) {
    revalidatePath(`/${locale}/dashboard/${workspaceSlug}/estimates/${estimateId}`);
  }
}

function revalidateAdminEstimateRequestDetail(locale: Locale, requestId: string) {
  revalidatePath(`/${locale}/dashboard/admin/estimate-requests/${requestId}`);
}

export async function adminArchiveEstimateRequestAction(
  requestId: string,
  locale: Locale = "pl",
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await assertPlatformAdminAccess(locale);
    const request = await adminArchiveEstimateRequest(admin, requestId);
    revalidateAdminEstimateRequests(locale);
    revalidateAdminEstimateRequestDetail(locale, requestId);
    revalidateWorkspaceEstimatePaths(locale, request.workspaceSlug, request.estimateId);
    return { success: true, data: { id: request.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function adminRestoreEstimateRequestAction(
  requestId: string,
  locale: Locale = "pl",
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await assertPlatformAdminAccess(locale);
    const request = await adminRestoreEstimateRequest(admin, requestId);
    revalidateAdminEstimateRequests(locale);
    revalidateAdminEstimateRequestDetail(locale, requestId);
    revalidateWorkspaceEstimatePaths(locale, request.workspaceSlug, request.estimateId);
    return { success: true, data: { id: request.id } };
  } catch (error) {
    return toActionError(error);
  }
}

