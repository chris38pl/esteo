import "server-only";

import { AttachmentUploadSource } from "@prisma/client";
import { NextResponse } from "next/server";

import { StagingAttachmentError } from "@/features/attachments/server/staging-attachment-errors";
import {
  resolveWorkspaceIdForPublicUpload,
  uploadStagingAttachment,
} from "@/features/attachments/server/staging-attachment-service";
import { StorageQuotaError } from "@/features/attachments/server/storage-errors";
import {
  assertPublicUploadRateLimit,
  buildPublicUploadFingerprint,
  getPublicRequestFingerprint,
} from "@/features/estimate-requests/server/security";

export const runtime = "nodejs";

function errorJson(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  try {
    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return errorJson("payload_too_large", 413);
    }

    const workspaceSlug = formData.get("workspaceSlug");
    const file = formData.get("file");
    const retryAttachmentId = formData.get("attachmentId");

    if (typeof workspaceSlug !== "string" || !(file instanceof File)) {
      return errorJson("invalid", 400);
    }

    const fingerprint = await getPublicRequestFingerprint();

    assertPublicUploadRateLimit({
      workspaceSlug,
      ip: fingerprint.ip,
    });

    const workspaceId = await resolveWorkspaceIdForPublicUpload(workspaceSlug);
    const publicFingerprint = buildPublicUploadFingerprint(fingerprint.ip, fingerprint.userAgent);

    const result = await uploadStagingAttachment({
      workspaceId,
      uploadSource: AttachmentUploadSource.PUBLIC_REQUEST,
      owner: { publicFingerprint },
      file,
      retryAttachmentId:
        typeof retryAttachmentId === "string" && retryAttachmentId.length > 0
          ? retryAttachmentId
          : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return errorJson("rate_limited", 429);
    }

    if (error instanceof StagingAttachmentError) {
      if (error.code === "WORKSPACE_NOT_FOUND") {
        return errorJson("unavailable", 404);
      }

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

    console.error("[public request-attachments upload]", error);
    return errorJson("unavailable", 500);
  }
}
