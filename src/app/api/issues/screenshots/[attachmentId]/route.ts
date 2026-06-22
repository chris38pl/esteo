import "server-only";

import { NextResponse } from "next/server";

import { StagingAttachmentError } from "@/features/attachments/server/staging-attachment-errors";
import { deleteIssueStagingAttachment } from "@/features/issues/server/issue-staging-attachment-service";
import { assertIssueTrackerEnabled } from "@/lib/issue-tracker/guard";
import { syncUserFromClerk } from "@/server/auth/sync-user";

export const runtime = "nodejs";

function errorJson(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ attachmentId: string }> },
) {
  try {
    assertIssueTrackerEnabled();

    const user = await syncUserFromClerk();

    if (!user) {
      return errorJson("unauthorized", 401);
    }

    const { attachmentId } = await context.params;

    await deleteIssueStagingAttachment({
      uploadedById: user.id,
      attachmentId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof StagingAttachmentError) {
      if (error.code === "NOT_FOUND" || error.code === "FORBIDDEN") {
        return errorJson("forbidden", 403);
      }

      if (error.code === "INVALID_STATUS") {
        return errorJson("invalid", 400);
      }
    }

    console.error("[issue-screenshots delete]", error);
    return errorJson("unavailable", 500);
  }
}
