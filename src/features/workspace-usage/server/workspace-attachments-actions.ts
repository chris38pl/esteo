"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { deleteEstimateAttachment } from "@/features/attachments/server/cleanup-service";
import { getAttachmentById } from "@/features/attachments/server/attachments-repository";
import { ESTIMATE_ACTIVITY_ACTIONS } from "@/features/estimates/lib/estimate-activity-types";
import { logEstimateActivity } from "@/features/estimates/server/activity-log";
import { revalidateEstimatePaths } from "@/features/estimates/server/revalidate-estimate-paths";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { PermissionError } from "@/server/permissions/errors";
import { requireRole } from "@/server/permissions/require-workspace";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof PermissionError) {
    return { success: false, error: error.message };
  }

  console.error("[workspace-attachments action]", error);
  return { success: false, error: "Something went wrong." };
}

export async function deleteWorkspaceAttachmentsAction(input: {
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  attachmentIds: string[];
}): Promise<ActionResult<{ deletedCount: number }>> {
  try {
    const user = await requireAuth(input.locale);
    await requireRole(user, input.workspaceId, "MEMBER");

    const uniqueIds = Array.from(new Set(input.attachmentIds));

    if (uniqueIds.length === 0) {
      return { success: false, error: "No attachments selected." };
    }

    const estimateIds = new Set<string>();
    let deletedCount = 0;

    for (const attachmentId of uniqueIds) {
      const attachment = await getAttachmentById(attachmentId, input.workspaceId);

      if (!attachment) {
        continue;
      }

      await deleteEstimateAttachment({
        attachmentId,
        workspaceId: input.workspaceId,
      });

      await logEstimateActivity({
        estimateId: attachment.estimateId,
        workspaceId: input.workspaceId,
        actorType: "USER",
        actorUserId: user.id,
        category: "ESTIMATE",
        action: ESTIMATE_ACTIVITY_ACTIONS.attachment_deleted,
        metadata: { fileName: attachment.originalFileName },
      });

      estimateIds.add(attachment.estimateId);
      deletedCount += 1;
    }

    if (deletedCount === 0) {
      return { success: false, error: "No attachments were deleted." };
    }

    revalidatePath(`/${input.locale}/dashboard/${input.workspaceSlug}/workspace-usage`);

    for (const estimateId of estimateIds) {
      revalidateEstimatePaths(input.locale, input.workspaceSlug, estimateId);
    }

    return { success: true, data: { deletedCount } };
  } catch (error) {
    return toActionError(error);
  }
}
