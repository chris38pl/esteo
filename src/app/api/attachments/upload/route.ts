import { NextResponse } from "next/server";

import { serializeEstimateAttachments } from "@/features/attachments/lib/serialize-attachments";
import { uploadPreparedAttachments } from "@/features/attachments/server/upload-service";
import { StorageQuotaError } from "@/features/attachments/server/storage-errors";
import { ESTIMATE_ACTIVITY_ACTIONS } from "@/features/estimates/lib/estimate-activity-types";
import { logEstimateActivity } from "@/features/estimates/server/activity-log";
import { assertEstimateInWorkspace } from "@/features/estimates/server/notes-repository";
import { syncUserFromClerk } from "@/server/auth/sync-user";
import { PermissionError } from "@/server/permissions/errors";
import { requireRole } from "@/server/permissions/require-workspace";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const user = await syncUserFromClerk();

    if (!user) {
      return errorResponse("Unauthorized.", 401);
    }

    const formData = await request.formData();
    const estimateId = formData.get("estimateId");
    const workspaceId = formData.get("workspaceId");

    if (typeof estimateId !== "string" || typeof workspaceId !== "string") {
      return errorResponse("Invalid request.", 400);
    }

    await requireRole(user, workspaceId, "MEMBER");
    await assertEstimateInWorkspace(estimateId, workspaceId);

    const fileEntries = formData.getAll("files");
    const files = fileEntries.filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return errorResponse("No files provided.", 400);
    }

    const created = await uploadPreparedAttachments({
      workspaceId,
      estimateId,
      uploadedById: user.id,
      files,
    });

    await logEstimateActivity({
      estimateId,
      workspaceId,
      actorType: "USER",
      actorUserId: user.id,
      category: "ESTIMATE",
      action: ESTIMATE_ACTIVITY_ACTIONS.attachment_added,
      metadata: {
        fileCount: created.length,
        ...(created.length === 1 ? { fileName: created[0].originalFileName } : {}),
      },
    });

    return NextResponse.json({
      attachments: serializeEstimateAttachments(created),
    });
  } catch (error) {
    if (error instanceof StorageQuotaError) {
      return errorResponse(error.message, 413);
    }

    if (error instanceof PermissionError) {
      return errorResponse(error.message, 403);
    }

    console.error("[attachments upload]", error);
    return errorResponse("Upload failed.", 500);
  }
}
