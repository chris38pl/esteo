import "server-only";

import { NextResponse } from "next/server";

import { StorageQuotaError } from "@/features/attachments/server/storage-errors";
import {
  SubmitEstimateRequestError,
  submitEstimateRequestWithAttachments,
} from "@/features/estimate-requests/server/submit-estimate-request-with-attachments";
import { DocumentFieldValidationError } from "@/features/industry-fields/server/validate-document-values";
import { publicEstimateRequestSchema } from "@/features/estimate-requests/schemas/request";
import {
  assertPublicSubmitRateLimit,
  getPublicRequestFingerprint,
  isHoneypotFilled,
  verifyEstimateRequestCaptcha,
} from "@/features/estimate-requests/server/security";
import { isLocale, type Locale } from "@/lib/locale";

export const runtime = "nodejs";

function errorJson(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  console.info("[public estimate-requests] incoming", {
    contentLength: request.headers.get("content-length"),
    contentType: request.headers.get("content-type"),
  });

  let bodyJson: unknown;

  try {
    bodyJson = await request.json();
  } catch (error) {
    console.error("[public estimate-requests] json parse failed", error);
    return errorJson("invalid", 400);
  }

  try {
    const parsed = publicEstimateRequestSchema.safeParse(bodyJson);

    if (!parsed.success) {
      return errorJson("invalid", 400);
    }

    if (isHoneypotFilled(parsed.data.security?.companyWebsite)) {
      return NextResponse.json({
        requestNumber: null,
        requestId: null,
        estimateId: null,
      });
    }

    const fingerprint = await getPublicRequestFingerprint();

    assertPublicSubmitRateLimit({
      workspaceSlug: parsed.data.workspaceSlug,
      ip: fingerprint.ip,
    });

    const captcha = await verifyEstimateRequestCaptcha(parsed.data.security?.captchaToken);

    if (!captcha.ok) {
      return errorJson("captcha_failed", 400);
    }

    const localeParam = new URL(request.url).searchParams.get("locale");
    const locale: Locale =
      localeParam !== null && isLocale(localeParam) ? localeParam : "pl";

    const { voiceIntake, attachmentIds, ...body } = parsed.data;

    const result = await submitEstimateRequestWithAttachments({
      locale,
      source: "PUBLIC_REQUEST",
      body,
      attachmentIds: attachmentIds ?? [],
      workspaceSlug: parsed.data.workspaceSlug,
      requestMeta: fingerprint,
      uploadedById: null,
      voiceIntakeMetadata: voiceIntake,
    });

    return NextResponse.json({
      requestNumber: result.requestNumber,
      requestId: result.requestId,
      estimateId: result.estimateId,
      queued: result.queued ?? false,
      attachmentWarnings:
        result.attachmentWarnings.length > 0 ? result.attachmentWarnings : undefined,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return errorJson("rate_limited", 429);
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

      if (error.code === "WORKSPACE_NOT_FOUND") {
        return errorJson("unavailable", 404);
      }
    }

    if (error instanceof StorageQuotaError) {
      return errorJson("storage_full", 413);
    }

    if (error instanceof DocumentFieldValidationError) {
      console.error("[public estimate-requests] field validation", error.message);
      return errorJson("invalid", 400);
    }

    console.error("[public estimate-requests]", error);
    return errorJson("unavailable", 500);
  }
}
