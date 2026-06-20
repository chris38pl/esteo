import "server-only";

import { NextResponse } from "next/server";

import { StagingAttachmentError } from "@/features/attachments/server/staging-attachment-errors";
import { deleteStagingAttachment } from "@/features/attachments/server/staging-attachment-service";
import { syncUserFromClerk } from "@/server/auth/sync-user";
import { PermissionError } from "@/server/permissions/errors";
import { requireRole } from "@/server/permissions/require-workspace";

export const runtime = "nodejs";

function errorJson(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ attachmentId: string }> },
) {
  try {
    const user = await syncUserFromClerk();

    if (!user) {
      return errorJson("unauthorized", 401);
    }

    const { attachmentId } = await context.params;
    const workspaceId = new URL(request.url).searchParams.get("workspaceId");

    if (!workspaceId) {
      return errorJson("invalid", 400);
    }

    await requireRole(user, workspaceId, "MEMBER");

    await deleteStagingAttachment({
      workspaceId,
      attachmentId,
      owner: { uploadedById: user.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PermissionError) {
      return errorJson("forbidden", 403);
    }

    if (error instanceof StagingAttachmentError) {
      if (error.code === "NOT_FOUND" || error.code === "FORBIDDEN") {
        return errorJson("forbidden", 403);
      }

      if (error.code === "INVALID_STATUS") {
        return errorJson("invalid", 400);
      }
    }

    console.error("[internal request-attachments delete]", error);
    return errorJson("unavailable", 500);
  }
}
