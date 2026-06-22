import "server-only";

import { NextResponse } from "next/server";

import { StagingAttachmentError } from "@/features/attachments/server/staging-attachment-errors";
import { StorageQuotaError } from "@/features/attachments/server/storage-errors";
import { uploadIssueStagingAttachment } from "@/features/issues/server/issue-staging-attachment-service";
import { assertIssueTrackerEnabled } from "@/lib/issue-tracker/guard";
import { syncUserFromClerk } from "@/server/auth/sync-user";

export const runtime = "nodejs";

function errorJson(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  try {
    assertIssueTrackerEnabled();

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

    const file = formData.get("file");
    const retryAttachmentId = formData.get("attachmentId");

    if (!(file instanceof File)) {
      return errorJson("invalid", 400);
    }

    const result = await uploadIssueStagingAttachment({
      uploadedById: user.id,
      file,
      retryAttachmentId:
        typeof retryAttachmentId === "string" && retryAttachmentId.length > 0
          ? retryAttachmentId
          : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
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

    console.error("[issue-screenshots upload]", error);
    return errorJson("unavailable", 500);
  }
}
