import "server-only";

import { NextResponse } from "next/server";

import {
  authenticateIntegrationRequest,
  buildCorsHeaders,
} from "@/server/integrations/http/auth";
import { createCorrelationIds } from "@/server/integrations/http/correlation";
import {
  integrationErrorResponse,
} from "@/server/integrations/http/errors";
import { resolveIntegrationLocale } from "@/server/integrations/http/locale";
import { handleCreatePublicRequest } from "@/server/integrations/requests/create-multipart";
import { writeIntegrationRequestLog } from "@/server/integrations/logs/service";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  const ids = createCorrelationIds(request);
  const auth = await authenticateIntegrationRequest(request);
  if (!auth.ok) {
    return integrationErrorResponse({
      code: auth.code,
      locale: resolveIntegrationLocale(request),
      status: auth.status,
      ids,
      details: auth.details,
    });
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      ...buildCorsHeaders(auth.apiKey, request),
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function POST(request: Request) {
  const ids = createCorrelationIds(request);
  return handleCreatePublicRequest(request, ids);
}

/** Scaffold - list requests (not implemented in v1 MVP). */
export async function GET(request: Request) {
  const ids = createCorrelationIds(request);
  const started = Date.now();
  const locale = resolveIntegrationLocale(request);
  const auth = await authenticateIntegrationRequest(request);

  if (!auth.ok) {
    return integrationErrorResponse({
      code: auth.code,
      locale,
      status: auth.status,
      ids,
      details: auth.details,
      retryAfterSeconds: auth.retryAfterSeconds,
    });
  }

  await writeIntegrationRequestLog({
    workspaceId: auth.apiKey.workspaceId,
    apiKeyId: auth.apiKey.id,
    httpRequestId: ids.httpRequestId,
    correlationId: ids.correlationId,
    method: "GET",
    path: "/api/v1/public/requests",
    statusCode: 501,
    durationMs: Date.now() - started,
    errorCode: "NOT_IMPLEMENTED",
    errorSummary: "GET /requests scaffold",
  }).catch(() => undefined);

  return integrationErrorResponse({
    code: "NOT_IMPLEMENTED",
    locale,
    status: 501,
    ids,
    headers: buildCorsHeaders(auth.apiKey, request),
  });
}
