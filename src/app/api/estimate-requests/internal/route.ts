import "server-only";

import { NextResponse } from "next/server";

import { StorageQuotaError } from "@/features/attachments/server/storage-errors";
import { parseInternalEstimateCreateBody } from "@/features/estimate-requests/server/parse-estimate-request-body";
import {
  SubmitEstimateRequestError,
  submitEstimateRequestWithAttachments,
} from "@/features/estimate-requests/server/submit-estimate-request-with-attachments";
import { DocumentFieldValidationError } from "@/features/industry-fields/server/validate-document-values";
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

    console.info("[internal estimate-requests] incoming", {
      contentLength: request.headers.get("content-length"),
      contentType: request.headers.get("content-type"),
    });

    let bodyJson: unknown;

    try {
      bodyJson = await request.json();
    } catch (error) {
      console.error("[internal estimate-requests] json parse failed", error);
      return errorJson("invalid", 400);
    }

    const payload =
      bodyJson && typeof bodyJson === "object" && "payload" in bodyJson
        ? (bodyJson as { payload: unknown; workspaceId?: unknown })
        : null;

    if (!payload || typeof payload.workspaceId !== "string") {
      return errorJson("invalid", 400);
    }

    await requireRole(user, payload.workspaceId, "MEMBER");

    const parsed = await parseInternalEstimateCreateBody(
      payload.workspaceId,
      payload.payload,
    );

    if (!parsed.success) {
      return errorJson(parsed.error, parsed.error === "unavailable" ? 404 : 400);
    }

    const localeParam = new URL(request.url).searchParams.get("locale");
    const locale: Locale =
      localeParam !== null && isLocale(localeParam) ? localeParam : "pl";

    const { voiceIntake, title, attachmentIds, ...body } = parsed.data;

    const result = await submitEstimateRequestWithAttachments({
      locale,
      source: "INTERNAL_REQUEST",
      body,
      attachmentIds: attachmentIds ?? [],
      workspaceId: payload.workspaceId,
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

      if (error.code === "ATTACHMENTS_NOT_READY") {
        return errorJson("attachments_not_ready", 422);
      }
    }

    if (error instanceof StorageQuotaError) {
      return errorJson("storage_full", 413);
    }

    if (error instanceof DocumentFieldValidationError) {
      console.error("[internal estimate-requests] field validation", error.message);
      return errorJson("invalid", 400);
    }

    console.error("[internal estimate-requests]", error);
    return errorJson("unavailable", 500);
  }
}
