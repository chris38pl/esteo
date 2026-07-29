"use server";

import { WorkspaceApiKeyMode } from "@prisma/client";
import { z } from "zod";

import { AttachmentUploadSource } from "@prisma/client";

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
import { requireAuth } from "@/server/auth/require-auth";
import { getFeatureState } from "@/server/billing/entitlement-service";
import {
  createWorkspaceApiKey,
  listWorkspaceApiKeys,
  regenerateWorkspaceApiKey,
  revokeWorkspaceApiKey,
  updateWorkspaceApiKey,
} from "@/server/integrations/keys/service";
import {
  listIntegrationRequestLogs,
  writeIntegrationRequestLog,
} from "@/server/integrations/logs/service";
import {
  estimateRequestLogReference,
  type IntegrationLogReference,
} from "@/server/integrations/logs/reference";
import {
  mapZodIssuesToIntegrationIssues,
  parseIndustryFieldValidationMessage,
  summarizeValidationIssues,
} from "@/server/integrations/http/validation-issues";
import { buildIntegrationSchemaForWorkspace } from "@/server/integrations/schema/builder";
import { prisma } from "@/db/client";
import { requireRole } from "@/server/permissions/require-workspace";

async function requireIntegrationsOwner(workspaceId: string) {
  const user = await requireAuth();
  await requireRole(user, workspaceId, "OWNER");
  const state = await getFeatureState(workspaceId, "INTEGRATIONS");
  if (state !== "ACTIVE") {
    throw new Error("INTEGRATIONS_DISABLED");
  }
  return user;
}

const originsSchema = z.array(z.string().trim().max(200)).max(20);
const ipsSchema = z.array(z.string().trim().max(64)).max(20);

export async function listIntegrationKeysAction(workspaceId: string) {
  const user = await requireAuth();
  await requireRole(user, workspaceId, "OWNER");
  return listWorkspaceApiKeys(workspaceId);
}

export async function createIntegrationKeyAction(input: {
  workspaceId: string;
  name: string;
  mode: "LIVE" | "TEST";
  allowedOrigins?: string[];
  allowedIps?: string[];
  rateLimitPerMinute?: number;
  rateLimitPerDay?: number;
}) {
  const user = await requireIntegrationsOwner(input.workspaceId);
  const name = input.name.trim();
  if (name.length < 2 || name.length > 80) {
    throw new Error("INVALID_NAME");
  }

  const result = await createWorkspaceApiKey({
    workspaceId: input.workspaceId,
    createdByUserId: user.id,
    name,
    mode: input.mode === "LIVE" ? WorkspaceApiKeyMode.LIVE : WorkspaceApiKeyMode.TEST,
    allowedOrigins: originsSchema.parse(input.allowedOrigins ?? []),
    allowedIps: ipsSchema.parse(input.allowedIps ?? []),
    rateLimitPerMinute: input.rateLimitPerMinute,
    rateLimitPerDay: input.rateLimitPerDay,
  });

  return result;
}

export async function revokeIntegrationKeyAction(input: {
  workspaceId: string;
  keyId: string;
}) {
  await requireIntegrationsOwner(input.workspaceId);
  const key = await revokeWorkspaceApiKey(input);
  return key;
}

export async function regenerateIntegrationKeyAction(input: {
  workspaceId: string;
  keyId: string;
}) {
  await requireIntegrationsOwner(input.workspaceId);
  const result = await regenerateWorkspaceApiKey(input);
  return result;
}

export async function updateIntegrationKeyAction(input: {
  workspaceId: string;
  keyId: string;
  name?: string;
  allowedOrigins?: string[];
  allowedIps?: string[];
  rateLimitPerMinute?: number;
  rateLimitPerDay?: number;
}) {
  await requireIntegrationsOwner(input.workspaceId);
  const key = await updateWorkspaceApiKey({
    workspaceId: input.workspaceId,
    keyId: input.keyId,
    name: input.name,
    allowedOrigins:
      input.allowedOrigins !== undefined
        ? originsSchema.parse(input.allowedOrigins)
        : undefined,
    allowedIps: input.allowedIps !== undefined ? ipsSchema.parse(input.allowedIps) : undefined,
    rateLimitPerMinute: input.rateLimitPerMinute,
    rateLimitPerDay: input.rateLimitPerDay,
  });
  return key;
}

export async function getIntegrationSchemaAction(workspaceId: string) {
  const user = await requireAuth();
  await requireRole(user, workspaceId, "OWNER");
  const schema = await buildIntegrationSchemaForWorkspace({ workspaceId });
  if (!schema) {
    throw new Error("WORKSPACE_NOT_FOUND");
  }
  return schema;
}

export async function listIntegrationLogsAction(workspaceId: string) {
  const user = await requireAuth();
  await requireRole(user, workspaceId, "OWNER");
  return listIntegrationRequestLogs({ workspaceId, take: 50 });
}

export async function tryIntegrationRequestAction(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const keyId = String(formData.get("keyId") ?? "");
  const payloadRaw = String(formData.get("payload") ?? "");
  const useTestKey = String(formData.get("useTestKey") ?? "true") === "true";
  const localeRaw = String(formData.get("locale") ?? "pl");
  const locale = localeRaw === "en" ? "en" : "pl";
  const started = Date.now();
  const httpRequestId = `try_${crypto.randomUUID()}`;

  await requireIntegrationsOwner(workspaceId);

  const finishTryLog = async (input: {
    apiKeyId?: string | null;
    statusCode: number;
    errorCode?: string | null;
    errorSummary?: string | null;
    estimateRequestId?: string | null;
    estimateId?: string | null;
    reference?: IntegrationLogReference | null;
  }) => {
    await writeIntegrationRequestLog({
      workspaceId,
      apiKeyId: input.apiKeyId ?? null,
      httpRequestId,
      correlationId: httpRequestId,
      method: "POST",
      path: "/integrations/ui/try",
      statusCode: input.statusCode,
      durationMs: Date.now() - started,
      errorCode: input.errorCode,
      errorSummary: input.errorSummary,
      estimateRequestId: input.estimateRequestId,
      estimateId: input.estimateId,
      reference: input.reference,
    }).catch(() => undefined);
  };

  const key = await prisma.workspaceApiKey.findFirst({
    where: {
      id: keyId,
      workspaceId,
      revokedAt: null,
      ...(useTestKey ? { mode: WorkspaceApiKeyMode.TEST } : {}),
    },
    include: { workspace: { select: { industry: true } } },
  });

  if (!key) {
    await finishTryLog({
      statusCode: 404,
      errorCode: useTestKey ? "TEST_KEY_REQUIRED" : "KEY_NOT_FOUND",
      errorSummary: useTestKey ? "TEST_KEY_REQUIRED" : "KEY_NOT_FOUND",
    });
    return {
      ok: false as const,
      error: useTestKey ? "TEST_KEY_REQUIRED" : "KEY_NOT_FOUND",
    };
  }

  if (useTestKey && key.mode !== "TEST") {
    await finishTryLog({
      apiKeyId: key.id,
      statusCode: 400,
      errorCode: "TEST_KEY_REQUIRED",
      errorSummary: "TEST_KEY_REQUIRED",
    });
    return { ok: false as const, error: "TEST_KEY_REQUIRED" };
  }

  let payloadJson: unknown;
  try {
    payloadJson = JSON.parse(payloadRaw);
  } catch {
    await finishTryLog({
      apiKeyId: key.id,
      statusCode: 422,
      errorCode: "INVALID_JSON",
      errorSummary: "INVALID_JSON",
    });
    return { ok: false as const, error: "INVALID_JSON" };
  }

  const parsed = createInternalEstimateCreateSchema(key.workspace.industry).safeParse(
    payloadJson,
  );
  if (!parsed.success) {
    const issues = mapZodIssuesToIntegrationIssues(parsed.error.issues, locale);
    const summary = summarizeValidationIssues(issues, locale);
    await finishTryLog({
      apiKeyId: key.id,
      statusCode: 422,
      errorCode: "VALIDATION_ERROR",
      errorSummary: summary,
    });
    return {
      ok: false as const,
      error: "VALIDATION_ERROR",
      message: summary,
      details: issues,
    };
  }

  const files = formData
    .getAll("attachments")
    .filter((entry): entry is File => typeof File !== "undefined" && entry instanceof File);

  const stored = await storeIntegrationAttachments({
    workspaceId,
    apiKeyId: key.id,
    files,
  });

  if (!stored.ok) {
    await finishTryLog({
      apiKeyId: key.id,
      statusCode: 422,
      errorCode: "ATTACHMENT_UPLOAD_FAILED",
      errorSummary: stored.error,
    });
    return { ok: false as const, error: "ATTACHMENT_UPLOAD_FAILED", details: stored.error };
  }

  const apiMode = key.mode === "TEST" || useTestKey ? "test" : "live";

  try {
    const result = await submitEstimateRequestWithAttachments({
      locale,
      source: AttachmentUploadSource.PUBLIC_API,
      workspaceId,
      body: parsed.data,
      attachmentIds: stored.refs.map((ref) => ref.attachmentId),
      apiMode,
      // Dashboard Try it: request only - no Estimate / Trigger / usage.
      requestOnly: true,
    });

    await finishTryLog({
      apiKeyId: key.id,
      statusCode: 201,
      estimateRequestId: result.requestId,
      estimateId: result.estimateId,
      reference: estimateRequestLogReference({
        requestId: result.requestId,
        requestNumber: result.requestNumber,
      }),
    });

    return {
      ok: true as const,
      result: {
        requestId: result.requestId,
        requestNumber: result.requestNumber,
        estimateId: result.estimateId,
        queued: Boolean(result.queued),
        test: apiMode === "test",
        requestOnly: true,
        usage: {
          meter: "ESTIMATE_CREATED",
          counted: Boolean(result.estimateId),
        },
      },
    };
  } catch (error) {
    await cleanupIntegrationAttachments({
      workspaceId,
      apiKeyId: key.id,
      refs: stored.refs,
    });

    if (error instanceof SubmitEstimateRequestError) {
      await finishTryLog({
        apiKeyId: key.id,
        statusCode: 422,
        errorCode: error.code,
        errorSummary: error.message,
      });
      return { ok: false as const, error: error.code, details: error.message };
    }

    if (error instanceof DocumentFieldValidationError) {
      const parsedIndustry = parseIndustryFieldValidationMessage(error.message, locale);
      await finishTryLog({
        apiKeyId: key.id,
        statusCode: 422,
        errorCode: "VALIDATION_ERROR",
        errorSummary: parsedIndustry.summary,
      });
      return {
        ok: false as const,
        error: "VALIDATION_ERROR",
        message: parsedIndustry.summary,
        details: parsedIndustry.issues,
      };
    }

    console.error("[integrations] tryIntegrationRequestAction failed", error);
    await finishTryLog({
      apiKeyId: key.id,
      statusCode: 500,
      errorCode: "INTERNAL_ERROR",
      errorSummary: error instanceof Error ? error.message : "unknown",
    });
    return {
      ok: false as const,
      error: "INTERNAL_ERROR",
      details: error instanceof Error ? error.message : "unknown",
    };
  }
}

export async function getIntegrationsAccessAction(workspaceId: string) {
  const user = await requireAuth();
  await requireRole(user, workspaceId, "OWNER");
  const state = await getFeatureState(workspaceId, "INTEGRATIONS");
  return { state };
}
