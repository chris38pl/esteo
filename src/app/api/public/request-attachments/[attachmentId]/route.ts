import "server-only";

import { NextResponse } from "next/server";

import { StagingAttachmentError } from "@/features/attachments/server/staging-attachment-errors";
import {
  deleteStagingAttachment,
  resolveWorkspaceIdForPublicUpload,
} from "@/features/attachments/server/staging-attachment-service";
import {
  buildPublicUploadFingerprint,
  getPublicRequestFingerprint,
} from "@/features/estimate-requests/server/security";

export const runtime = "nodejs";

function errorJson(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ attachmentId: string }> },
) {
  try {
    const { attachmentId } = await context.params;
    const workspaceSlug = new URL(request.url).searchParams.get("workspaceSlug");

    if (!workspaceSlug) {
      return errorJson("invalid", 400);
    }

    const fingerprint = await getPublicRequestFingerprint();
    const workspaceId = await resolveWorkspaceIdForPublicUpload(workspaceSlug);
    const publicFingerprint = buildPublicUploadFingerprint(fingerprint.ip, fingerprint.userAgent);

    await deleteStagingAttachment({
      workspaceId,
      attachmentId,
      owner: { publicFingerprint },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof StagingAttachmentError) {
      if (error.code === "WORKSPACE_NOT_FOUND") {
        return errorJson("unavailable", 404);
      }

      if (error.code === "NOT_FOUND" || error.code === "FORBIDDEN") {
        return errorJson("forbidden", 403);
      }

      if (error.code === "INVALID_STATUS") {
        return errorJson("invalid", 400);
      }
    }

    console.error("[public request-attachments delete]", error);
    return errorJson("unavailable", 500);
  }
}
