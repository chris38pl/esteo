import "server-only";

import { AttachmentUploadSource } from "@prisma/client";
import { NextResponse } from "next/server";

import { StagingAttachmentError } from "@/features/attachments/server/staging-attachment-errors";
import { uploadStagingAttachment } from "@/features/attachments/server/staging-attachment-service";
import { StorageQuotaError } from "@/features/attachments/server/storage-errors";
import { syncUserFromClerk } from "@/server/auth/sync-user";
import { PermissionError } from "@/server/permissions/errors";
import { requireRole } from "@/server/permissions/require-workspace";

export const runtime = "nodejs";

function errorJson(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  try {
    const user = await syncUserFromClerk();

    if (!user) {
      return errorJson("unauthorized", 401);
    }

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return errorJson("payload_too_large", 413);
    }

    const workspaceId = formData.get("workspaceId");
    const file = formData.get("file");
    const retryAttachmentId = formData.get("attachmentId");

    if (typeof workspaceId !== "string" || !(file instanceof File)) {
      return errorJson("invalid", 400);
    }

    await requireRole(user, workspaceId, "MEMBER");

    const result = await uploadStagingAttachment({
      workspaceId,
      uploadSource: AttachmentUploadSource.INTERNAL_REQUEST,
      owner: { uploadedById: user.id },
      file,
      retryAttachmentId:
        typeof retryAttachmentId === "string" && retryAttachmentId.length > 0
          ? retryAttachmentId
          : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PermissionError) {
      return errorJson("forbidden", 403);
    }

    if (error instanceof StagingAttachmentError) {
      if (error.code === "EXPIRED" || error.code === "INVALID_STATUS") {
        return errorJson("invalid", 400);
      }

      if (error.code === "NOT_FOUND" || error.code === "FORBIDDEN") {
        return errorJson("forbidden", 403);
      }
    }

    if (error instanceof StorageQuotaError) {
      return errorJson("storage_full", 413);
    }

    console.error("[internal request-attachments upload]", error);
    return errorJson("unavailable", 500);
  }
}
