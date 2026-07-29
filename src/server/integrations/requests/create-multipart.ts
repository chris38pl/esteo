import "server-only";

import { createHash } from "crypto";
import { AttachmentUploadSource } from "@prisma/client";
import type { NextResponse } from "next/server";

import { isAllowedAttachmentMimeType } from "@/features/attachments/lib/allowed-mime-types";
import { MAX_SINGLE_FILE_BYTES } from "@/features/attachments/lib/constants";
import {
  MAX_REQUEST_ATTACHMENT_FILES,
  MAX_REQUEST_ATTACHMENT_TOTAL_BYTES,
} from "@/features/attachments/lib/request-limits";
import {
  cleanupIntegrationAttachments,
  storeIntegrationAttachments,
} from "@/features/attachments/server/attachment-service";
import { createInternalEstimateCreateSchema } from "@/features/estimate-requests/schemas/request";
import {
  SubmitEstimateRequestError,
  submitEstimateRequestWithAttachments,
} from "@/features/estimate-requests/server/submit-estimate-request-with-attachments";
import { DocumentFieldValidationError } from "@/features/industry-fields/server/validate-document-values";
import type { Locale } from "@/lib/locale";
import {
  authenticateIntegrationRequest,
  buildCorsHeaders,
  getClientIp,
} from "@/server/integrations/http/auth";
import type { CorrelationIds } from "@/server/integrations/http/correlation";
import {
  integrationErrorResponse,
  integrationJsonResponse,
} from "@/server/integrations/http/errors";
import {
  mapZodIssuesToIntegrationIssues,
  parseIndustryFieldValidationMessage,
  summarizeValidationIssues,
} from "@/server/integrations/http/validation-issues";
import {
  findIdempotencyRecord,
  saveIdempotencyRecord,
} from "@/server/integrations/http/idempotency";
import { resolveIntegrationLocale } from "@/server/integrations/http/locale";
import { writeIntegrationRequestLog } from "@/server/integrations/logs/service";
import {
  estimateRequestLogReference,
  referenceFromIdempotentBody,
  type IntegrationLogReference,
} from "@/server/integrations/logs/reference";

function fingerprintRequest(payloadRaw: string, files: File[]): string {
  const fileMeta = files
    .map((file) => `${file.name}:${file.size}:${file.type}`)
    .sort()
    .join("|");
  return createHash("sha256").update(`${payloadRaw}\n${fileMeta}`).digest("hex");
}

function validateAttachments(files: File[], locale: Locale) {
  const maxAttachments = MAX_REQUEST_ATTACHMENT_FILES;
  const maxAttachmentSizeMb = MAX_SINGLE_FILE_BYTES / (1024 * 1024);
  const maxTotalSizeMb = MAX_REQUEST_ATTACHMENT_TOTAL_BYTES / (1024 * 1024);
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  if (files.length > maxAttachments) {
    return {
      code: "ATTACHMENT_LIMIT_EXCEEDED" as const,
      details: {
        maxAttachments,
        maxAttachmentSizeMb,
        maxTotalSizeMb,
        receivedAttachments: files.length,
        receivedTotalSizeMb: Number((totalBytes / (1024 * 1024)).toFixed(2)),
      },
    };
  }

  for (const file of files) {
    if (file.size > MAX_SINGLE_FILE_BYTES) {
      return {
        code: "ATTACHMENT_LIMIT_EXCEEDED" as const,
        details: {
          maxAttachments,
          maxAttachmentSizeMb,
          maxTotalSizeMb,
          receivedAttachments: files.length,
          receivedTotalSizeMb: Number((totalBytes / (1024 * 1024)).toFixed(2)),
          fileName: file.name,
          fileSizeMb: Number((file.size / (1024 * 1024)).toFixed(2)),
        },
      };
    }

    if (!isAllowedAttachmentMimeType(file.type)) {
      return {
        code: "UNSUPPORTED_MEDIA_TYPE" as const,
        details: {
          fileName: file.name,
          mimeType: file.type,
          locale,
        },
      };
    }
  }

  if (totalBytes > MAX_REQUEST_ATTACHMENT_TOTAL_BYTES) {
    return {
      code: "ATTACHMENT_LIMIT_EXCEEDED" as const,
      details: {
        maxAttachments,
        maxAttachmentSizeMb,
        maxTotalSizeMb,
        receivedAttachments: files.length,
        receivedTotalSizeMb: Number((totalBytes / (1024 * 1024)).toFixed(2)),
      },
    };
  }

  return null;
}

export async function handleCreatePublicRequest(
  request: Request,
  ids: CorrelationIds,
): Promise<NextResponse> {
  const started = Date.now();
  let workspaceIdForLog: string | null = null;
  let apiKeyIdForLog: string | null = null;
  let idempotencyKey: string | null = null;
  let locale: Locale = "pl";

  const finishLog = async (input: {
    statusCode: number;
    errorCode?: string | null;
    errorSummary?: string | null;
    estimateRequestId?: string | null;
    estimateId?: string | null;
    reference?: IntegrationLogReference | null;
  }) => {
    if (!workspaceIdForLog) {
      return;
    }
    await writeIntegrationRequestLog({
      workspaceId: workspaceIdForLog,
      apiKeyId: apiKeyIdForLog,
      httpRequestId: ids.httpRequestId,
      correlationId: ids.correlationId,
      method: "POST",
      path: "/api/v1/public/requests",
      statusCode: input.statusCode,
      durationMs: Date.now() - started,
      errorCode: input.errorCode,
      errorSummary: input.errorSummary,
      estimateRequestId: input.estimateRequestId,
      estimateId: input.estimateId,
      reference: input.reference,
      idempotencyKey,
    }).catch(() => undefined);
  };

  const auth = await authenticateIntegrationRequest(request);
  locale = resolveIntegrationLocale(request);

  if (!auth.ok) {
    const response = integrationErrorResponse({
      code: auth.code,
      locale,
      status: auth.status,
      details: auth.details,
      ids,
      retryAfterSeconds: auth.retryAfterSeconds,
    });
    return response;
  }

  const { apiKey } = auth;
  workspaceIdForLog = apiKey.workspaceId;
  apiKeyIdForLog = apiKey.id;
  const cors = buildCorsHeaders(apiKey, request);
  locale = resolveIntegrationLocale(request);

  idempotencyKey = request.headers.get("idempotency-key")?.trim() || null;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    const response = integrationErrorResponse({
      code: "VALIDATION_ERROR",
      locale,
      status: 422,
      details: { reason: "expected_multipart_form_data" },
      ids,
      headers: cors,
    });
    await finishLog({
      statusCode: 422,
      errorCode: "VALIDATION_ERROR",
      errorSummary: "expected_multipart_form_data",
    });
    return response;
  }

  const formLocale = form.get("locale");
  locale = resolveIntegrationLocale(
    request,
    typeof formLocale === "string" ? formLocale : null,
  );

  const payloadField = form.get("payload");
  if (typeof payloadField !== "string") {
    const response = integrationErrorResponse({
      code: "VALIDATION_ERROR",
      locale,
      status: 422,
      details: { reason: "payload_required" },
      ids,
      headers: cors,
    });
    await finishLog({
      statusCode: 422,
      errorCode: "VALIDATION_ERROR",
      errorSummary: "payload_required",
    });
    return response;
  }

  const files = form
    .getAll("attachments")
    .filter((entry): entry is File => typeof File !== "undefined" && entry instanceof File);

  const attachmentError = validateAttachments(files, locale);
  if (attachmentError) {
    const response = integrationErrorResponse({
      code: attachmentError.code,
      locale,
      status: 422,
      details: attachmentError.details,
      ids,
      headers: cors,
    });
    await finishLog({
      statusCode: 422,
      errorCode: attachmentError.code,
      errorSummary: attachmentError.code,
    });
    return response;
  }

  let payloadJson: unknown;
  try {
    payloadJson = JSON.parse(payloadField);
  } catch {
    const response = integrationErrorResponse({
      code: "VALIDATION_ERROR",
      locale,
      status: 422,
      details: { reason: "payload_invalid_json" },
      ids,
      headers: cors,
    });
    await finishLog({
      statusCode: 422,
      errorCode: "VALIDATION_ERROR",
      errorSummary: "payload_invalid_json",
    });
    return response;
  }

  const parsed = createInternalEstimateCreateSchema(apiKey.workspace.industry).safeParse(
    payloadJson,
  );

  if (!parsed.success) {
    const issues = mapZodIssuesToIntegrationIssues(parsed.error.issues, locale);
    const summary = summarizeValidationIssues(issues, locale);
    const response = integrationErrorResponse({
      code: "VALIDATION_ERROR",
      locale,
      status: 422,
      message: summary,
      details: { issues },
      ids,
      headers: cors,
    });
    await finishLog({
      statusCode: 422,
      errorCode: "VALIDATION_ERROR",
      errorSummary: summary,
    });
    return response;
  }

  const requestHash = fingerprintRequest(payloadField, files);

  if (idempotencyKey) {
    const existing = await findIdempotencyRecord({
      apiKeyId: apiKey.id,
      key: idempotencyKey,
    });

    if (existing) {
      if (existing.requestHash && existing.requestHash !== requestHash) {
        const response = integrationErrorResponse({
          code: "IDEMPOTENCY_CONFLICT",
          locale,
          status: 409,
          ids,
          headers: cors,
        });
        await finishLog({
          statusCode: 409,
          errorCode: "IDEMPOTENCY_CONFLICT",
          errorSummary: "body_mismatch",
        });
        return response;
      }

      const response = integrationJsonResponse({
        body: existing.responseBody,
        status: existing.responseStatus,
        ids,
        headers: cors,
      });
      await finishLog({
        statusCode: existing.responseStatus,
        estimateRequestId:
          typeof existing.responseBody === "object" &&
          existing.responseBody &&
          "requestId" in existing.responseBody
            ? String((existing.responseBody as { requestId?: string }).requestId ?? "")
            : null,
        reference: referenceFromIdempotentBody(existing.responseBody),
      });
      return response;
    }
  }

  const stored = await storeIntegrationAttachments({
    workspaceId: apiKey.workspaceId,
    apiKeyId: apiKey.id,
    files,
  });

  if (!stored.ok) {
    const response = integrationErrorResponse({
      code: "ATTACHMENT_UPLOAD_FAILED",
      locale,
      status: 422,
      details: { reason: stored.error },
      ids,
      headers: cors,
    });
    await finishLog({
      statusCode: 422,
      errorCode: "ATTACHMENT_UPLOAD_FAILED",
      errorSummary: stored.error,
    });
    return response;
  }

  const apiMode = apiKey.mode === "TEST" ? "test" : "live";

  try {
    const result = await submitEstimateRequestWithAttachments({
      locale,
      source: AttachmentUploadSource.PUBLIC_API,
      workspaceId: apiKey.workspaceId,
      body: parsed.data,
      attachmentIds: stored.refs.map((ref) => ref.attachmentId),
      apiMode,
      requestMeta: {
        ip: getClientIp(request),
        userAgent: request.headers.get("user-agent") ?? "unknown",
      },
    });

    const body = {
      requestId: result.requestId,
      requestNumber: result.requestNumber,
      estimateId: result.estimateId,
      queued: Boolean(result.queued),
      test: apiMode === "test",
      usage: {
        meter: "ESTIMATE_CREATED",
        counted: Boolean(result.estimateId),
      },
    };

    const status = idempotencyKey ? 201 : 201;

    if (idempotencyKey) {
      await saveIdempotencyRecord({
        workspaceId: apiKey.workspaceId,
        apiKeyId: apiKey.id,
        key: idempotencyKey,
        requestHash,
        responseStatus: status,
        responseBody: body,
      });
    }

    const response = integrationJsonResponse({
      body,
      status,
      ids,
      headers: cors,
    });

    await finishLog({
      statusCode: status,
      estimateRequestId: result.requestId,
      estimateId: result.estimateId,
      reference: estimateRequestLogReference({
        requestId: result.requestId,
        requestNumber: result.requestNumber,
      }),
    });

    return response;
  } catch (error) {
    await cleanupIntegrationAttachments({
      workspaceId: apiKey.workspaceId,
      apiKeyId: apiKey.id,
      refs: stored.refs,
    });

    if (error instanceof SubmitEstimateRequestError) {
      const code =
        error.code === "STORAGE_FULL"
          ? "STORAGE_FULL"
          : error.code === "WORKSPACE_NOT_FOUND" || error.code === "UNAVAILABLE"
            ? "UNAVAILABLE"
            : "VALIDATION_ERROR";
      const status = code === "UNAVAILABLE" ? 404 : 422;
      const response = integrationErrorResponse({
        code,
        locale,
        status,
        details: { reason: error.code, message: error.message },
        ids,
        headers: cors,
      });
      await finishLog({
        statusCode: status,
        errorCode: code,
        errorSummary: error.message,
      });
      return response;
    }

    if (error instanceof DocumentFieldValidationError) {
      const parsedIndustry = parseIndustryFieldValidationMessage(error.message, locale);
      const response = integrationErrorResponse({
        code: "VALIDATION_ERROR",
        locale,
        status: 422,
        message: parsedIndustry.summary,
        details: {
          reason: "industry_fields",
          issues: parsedIndustry.issues,
        },
        ids,
        headers: cors,
      });
      await finishLog({
        statusCode: 422,
        errorCode: "VALIDATION_ERROR",
        errorSummary: parsedIndustry.summary,
      });
      return response;
    }

    console.error("[integrations] create request failed", {
      correlationId: ids.correlationId,
      error,
    });

    const response = integrationErrorResponse({
      code: "INTERNAL_ERROR",
      locale,
      status: 500,
      ids,
      headers: cors,
    });
    await finishLog({
      statusCode: 500,
      errorCode: "INTERNAL_ERROR",
      errorSummary: error instanceof Error ? error.message : "unknown",
    });
    return response;
  }
}
