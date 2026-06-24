"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import {
  ConvertRequestToEstimateError,
  convertRequestToEstimate,
} from "@/features/estimate-requests/server/convert-request-to-estimate";
import { prisma } from "@/db/client";
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
  templateId?: string | null;
  priceListId?: string | null;
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
      templateId: input.templateId,
      priceListId: input.priceListId,
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

export async function deleteLinkedEstimateFromRequestAction(input: {
  workspaceId: string;
  workspaceSlug: string;
  requestId: string;
  estimateId: string;
  locale: Locale;
}): Promise<ActionResult<void>> {
  try {
    const user = await requireAuth(input.locale);
    await requireWorkspace(user, input.workspaceId);
    await requireRole(user, input.workspaceId, "MEMBER");

    const request = await prisma.estimateRequest.findFirst({
      where: {
        id: input.requestId,
        workspaceId: input.workspaceId,
        estimateId: input.estimateId,
        deletedAt: null,
      },
      select: { id: true, estimateId: true },
    });

    if (!request?.estimateId) {
      return { success: false, error: "Linked estimate not found." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.estimate.update({
        where: { id: input.estimateId },
        data: { deletedAt: new Date() },
      });
      await tx.estimateRequest.update({
        where: { id: input.requestId },
        data: { estimateId: null },
      });
    });

    revalidatePath(`/${input.locale}/dashboard/${input.workspaceSlug}/requests`);
    revalidatePath(
      `/${input.locale}/dashboard/${input.workspaceSlug}/requests/${input.requestId}`,
    );
    revalidatePath(`/${input.locale}/dashboard/${input.workspaceSlug}/estimates`);

    return { success: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
