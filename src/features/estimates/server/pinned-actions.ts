"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { PermissionError } from "@/server/permissions/errors";
import {
  pinEstimate,
  reorderPinnedEstimates,
  unpinEstimate,
} from "@/features/estimates/server/pinned-estimates";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof PermissionError) {
    return { success: false, error: error.message };
  }
  console.error("[pinned estimate action]", error);
  return { success: false, error: "Something went wrong." };
}

function revalidatePinnedSidebar(locale: Locale, workspaceSlug: string): void {
  revalidatePath(`/${locale}/dashboard/${workspaceSlug}`, "layout");
}

export async function togglePinEstimateAction(input: {
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  pin: boolean;
}): Promise<ActionResult<{ pinned: boolean }>> {
  try {
    const user = await requireAuth(input.locale);
    if (input.pin) {
      await pinEstimate(user, {
        workspaceId: input.workspaceId,
        estimateId: input.estimateId,
      });
    } else {
      await unpinEstimate(user, {
        workspaceId: input.workspaceId,
        estimateId: input.estimateId,
      });
    }
    revalidatePinnedSidebar(input.locale, input.workspaceSlug);
    return { success: true, data: { pinned: input.pin } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderPinnedEstimatesAction(input: {
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  estimateIds: string[];
}): Promise<ActionResult<{ ok: true }>> {
  try {
    const user = await requireAuth(input.locale);
    await reorderPinnedEstimates(user, {
      workspaceId: input.workspaceId,
      estimateIds: input.estimateIds,
    });
    revalidatePinnedSidebar(input.locale, input.workspaceSlug);
    return { success: true, data: { ok: true } };
  } catch (error) {
    return toActionError(error);
  }
}
