"use server";

import "server-only";

import { createEstimateNoteSchema } from "@/features/estimates/schemas/estimate-note";
import { serializeEstimateNote } from "@/features/estimates/lib/serialize-estimate-notes";
import type { EstimateNoteClient } from "@/features/estimates/lib/serialize-estimate-notes";
import { revalidateEstimatePaths } from "@/features/estimates/server/revalidate-estimate-paths";
import {
  assertEstimateInWorkspace,
  createEstimateNote,
  deleteEstimateNote,
} from "@/features/estimates/server/notes-repository";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { PermissionError } from "@/server/permissions/errors";
import { requireRole } from "@/server/permissions/require-workspace";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof PermissionError) {
    return { success: false, error: error.message };
  }
  console.error("[estimate notes action]", error);
  return { success: false, error: "Something went wrong." };
}

export async function createEstimateNoteAction(input: {
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  body: string;
  parentId?: string;
}): Promise<ActionResult<{ note: EstimateNoteClient }>> {
  try {
    const parsed = createEstimateNoteSchema.safeParse({
      body: input.body,
      parentId: input.parentId,
    });

    if (!parsed.success) {
      return { success: false, error: "Invalid note." };
    }

    const user = await requireAuth(input.locale);
    await requireRole(user, input.workspaceId, "VIEWER");
    await assertEstimateInWorkspace(input.estimateId, input.workspaceId);

    const row = await createEstimateNote({
      estimateId: input.estimateId,
      authorUserId: user.id,
      body: parsed.data.body,
      parentId: parsed.data.parentId,
    });

    revalidateEstimatePaths(input.locale, input.workspaceSlug, input.estimateId);

    return {
      success: true,
      data: { note: serializeEstimateNote(row) },
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteEstimateNoteAction(input: {
  noteId: string;
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
}): Promise<ActionResult<{ ok: true }>> {
  try {
    const user = await requireAuth(input.locale);
    await requireRole(user, input.workspaceId, "VIEWER");
    await assertEstimateInWorkspace(input.estimateId, input.workspaceId);

    await deleteEstimateNote({
      noteId: input.noteId,
      estimateId: input.estimateId,
      authorUserId: user.id,
    });

    revalidateEstimatePaths(input.locale, input.workspaceSlug, input.estimateId);

    return { success: true, data: { ok: true } };
  } catch (error) {
    return toActionError(error);
  }
}
