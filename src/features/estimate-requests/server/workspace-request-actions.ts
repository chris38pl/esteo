"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import {
  ConvertRequestToEstimateError,
  convertRequestToEstimate,
} from "@/features/estimate-requests/server/convert-request-to-estimate";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { EntitlementError, PermissionError } from "@/server/permissions/errors";
import { requireRole, requireWorkspace } from "@/server/permissions/require-workspace";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof PermissionError || error instanceof EntitlementError) {
    return { success: false, error: error.message };
  }

  if (error instanceof ConvertRequestToEstimateError) {
    if (error.code === "NOT_FOUND") {
      return { success: false, error: "Request not found." };
    }
    if (error.code === "ALREADY_LINKED") {
      return { success: false, error: "This request already has a linked estimate." };
    }
    if (error.code === "ENTITLEMENT") {
      return { success: false, error: error.message };
    }
  }

  console.error("[workspace-request action]", error);
  return { success: false, error: "Something went wrong." };
}

export async function convertRequestToEstimateAction(input: {
  workspaceId: string;
  workspaceSlug: string;
  requestId: string;
  locale: Locale;
}): Promise<ActionResult<{ estimateId: string }>> {
  try {
    const user = await requireAuth(input.locale);
    await requireWorkspace(user, input.workspaceId);
    await requireRole(user, input.workspaceId, "MEMBER");

    const result = await convertRequestToEstimate({
      requestId: input.requestId,
      workspaceId: input.workspaceId,
      userId: user.id,
      locale: input.locale,
    });

    revalidatePath(`/${input.locale}/dashboard/${input.workspaceSlug}/requests`);
    revalidatePath(
      `/${input.locale}/dashboard/${input.workspaceSlug}/requests/${input.requestId}`,
    );
    revalidatePath(`/${input.locale}/dashboard/${input.workspaceSlug}/estimates`);
    revalidatePath(`/${input.locale}/dashboard/${input.workspaceSlug}/billing`);

    return { success: true, data: { estimateId: result.estimateId } };
  } catch (error) {
    return toActionError(error);
  }
}
