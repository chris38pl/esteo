"use server";

import "server-only";

import { AttachmentThumbnailStatus } from "@prisma/client";

import { revalidateEstimatePaths } from "@/features/estimates/server/revalidate-estimate-paths";
import { assertEstimateInWorkspace } from "@/features/estimates/server/notes-repository";
import {
  getAttachmentById,
  listAttachmentsByEstimateId,
} from "@/features/attachments/server/attachments-repository";
import { deleteEstimateAttachment } from "@/features/attachments/server/cleanup-service";
import {
  serializeEstimateAttachment,
  serializeEstimateAttachments,
  type EstimateAttachmentClient,
} from "@/features/attachments/lib/serialize-attachments";
import { getStorageProvider } from "@/features/attachments/server/storage";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { PermissionError } from "@/server/permissions/errors";
import { requireRole } from "@/server/permissions/require-workspace";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof PermissionError) {
    return { success: false, error: error.message };
  }

  console.error("[attachments action]", error);
  return { success: false, error: "Something went wrong." };
}

export async function deleteEstimateAttachmentAction(input: {
  attachmentId: string;
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
}): Promise<ActionResult<{ ok: true }>> {
  try {
    const user = await requireAuth(input.locale);
    await requireRole(user, input.workspaceId, "MEMBER");
    await assertEstimateInWorkspace(input.estimateId, input.workspaceId);

    const attachment = await getAttachmentById(input.attachmentId, input.workspaceId);

    if (!attachment || attachment.estimateId !== input.estimateId) {
      return { success: false, error: "Attachment not found." };
    }

    await deleteEstimateAttachment({
      attachmentId: input.attachmentId,
      workspaceId: input.workspaceId,
    });

    revalidateEstimatePaths(input.locale, input.workspaceSlug, input.estimateId);

    return { success: true, data: { ok: true } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getAttachmentSignedUrlAction(input: {
  attachmentId: string;
  estimateId: string;
  workspaceId: string;
  locale: Locale;
  variant?: "original" | "thumbnail";
}): Promise<ActionResult<{ url: string }>> {
  try {
    const user = await requireAuth(input.locale);
    await requireRole(user, input.workspaceId, "VIEWER");
    await assertEstimateInWorkspace(input.estimateId, input.workspaceId);

    const attachment = await getAttachmentById(input.attachmentId, input.workspaceId);

    if (!attachment || attachment.estimateId !== input.estimateId) {
      return { success: false, error: "Attachment not found." };
    }

    const variant = input.variant ?? "original";

    if (variant === "thumbnail" && attachment.thumbnailStatus !== AttachmentThumbnailStatus.GENERATED) {
      return { success: false, error: "Thumbnail not available." };
    }

    const key =
      variant === "thumbnail" && attachment.thumbnailStorageKey
        ? attachment.thumbnailStorageKey
        : attachment.storageKey;

    const url = await getStorageProvider().getSignedUrl(key, { expiresInSeconds: 15 * 60 });

    return { success: true, data: { url } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function listEstimateAttachmentsAction(input: {
  estimateId: string;
  workspaceId: string;
  locale: Locale;
}): Promise<ActionResult<{ attachments: EstimateAttachmentClient[] }>> {
  try {
    const user = await requireAuth(input.locale);
    await requireRole(user, input.workspaceId, "VIEWER");
    await assertEstimateInWorkspace(input.estimateId, input.workspaceId);

    const rows = await listAttachmentsByEstimateId(input.estimateId, input.workspaceId);

    return {
      success: true,
      data: { attachments: serializeEstimateAttachments(rows) },
    };
  } catch (error) {
    return toActionError(error);
  }
}

export { serializeEstimateAttachment };
