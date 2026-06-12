import "server-only";

import { NextResponse } from "next/server";

import { StorageQuotaError } from "@/features/attachments/server/storage-errors";
import { internalEstimateCreateSchema } from "@/features/estimate-requests/schemas/request";
import {
  SubmitEstimateRequestError,
  submitEstimateRequestWithAttachments,
} from "@/features/estimate-requests/server/submit-estimate-request-with-attachments";
import { syncUserFromClerk } from "@/server/auth/sync-user";
import { isLocale, type Locale } from "@/lib/locale";
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

    const formData = await request.formData();
    const payloadRaw = formData.get("payload");
    const workspaceId = formData.get("workspaceId");

    if (typeof payloadRaw !== "string" || typeof workspaceId !== "string") {
      return errorJson("invalid", 400);
    }

    let payloadJson: unknown;

    try {
      payloadJson = JSON.parse(payloadRaw);
    } catch {
      return errorJson("invalid", 400);
    }

    const parsed = internalEstimateCreateSchema.safeParse(payloadJson);

    if (!parsed.success) {
      return errorJson("invalid", 400);
    }

    await requireRole(user, workspaceId, "MEMBER");

    const localeParam = new URL(request.url).searchParams.get("locale");
    const locale: Locale =
      localeParam !== null && isLocale(localeParam) ? localeParam : "pl";

    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    const { voiceIntake, title, ...body } = parsed.data;

    const result = await submitEstimateRequestWithAttachments({
      locale,
      source: "INTERNAL_REQUEST",
      body,
      files,
      workspaceId,
      uploadedById: user.id,
      userId: user.id,
      explicitTitle: title?.trim() || undefined,
      voiceIntakeMetadata: voiceIntake,
    });

    return NextResponse.json({
      requestNumber: result.requestNumber,
      requestId: result.requestId,
      estimateId: result.estimateId,
      attachmentWarnings:
        result.attachmentWarnings.length > 0 ? result.attachmentWarnings : undefined,
    });
  } catch (error) {
    if (error instanceof PermissionError) {
      return errorJson("forbidden", 403);
    }

    if (error instanceof SubmitEstimateRequestError) {
      if (error.code === "STORAGE_FULL") {
        return errorJson("storage_full", 413);
      }

      if (error.code === "ALL_ATTACHMENTS_FAILED") {
        return errorJson("all_attachments_failed", 422);
      }
    }

    if (error instanceof StorageQuotaError) {
      return errorJson("storage_full", 413);
    }

    console.error("[internal estimate-requests]", error);
    return errorJson("unavailable", 500);
  }
}
