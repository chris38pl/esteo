import "server-only";

import { createCorrelationIds } from "@/server/integrations/http/correlation";
import {
  authenticateIntegrationRequest,
  buildCorsHeaders,
} from "@/server/integrations/http/auth";
import {
  integrationErrorResponse,
  integrationJsonResponse,
} from "@/server/integrations/http/errors";
import { resolveIntegrationLocale } from "@/server/integrations/http/locale";
import { writeIntegrationRequestLog } from "@/server/integrations/logs/service";
import { buildIntegrationSchemaForWorkspace } from "@/server/integrations/schema/builder";
import { INTEGRATION_API_SCOPE_REQUESTS_WRITE } from "@/server/integrations/version";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  const ids = createCorrelationIds(request);
  const auth = await authenticateIntegrationRequest(
    request,
    INTEGRATION_API_SCOPE_REQUESTS_WRITE,
  );
  if (!auth.ok) {
    return integrationErrorResponse({
      code: auth.code,
      locale: resolveIntegrationLocale(request),
      status: auth.status,
      ids,
      details: auth.details,
    });
  }

  return new Response(null, {
    status: 204,
    headers: {
      ...buildCorsHeaders(auth.apiKey, request),
      "Access-Control-Max-Age": "86400",
    },
  });
}

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

  const body = await buildIntegrationSchemaForWorkspace({
    workspaceId: auth.apiKey.workspaceId,
    locale,
  });

  if (!body) {
    return integrationErrorResponse({
      code: "UNAVAILABLE",
      locale,
      status: 404,
      ids,
      headers: buildCorsHeaders(auth.apiKey, request),
    });
  }

  await writeIntegrationRequestLog({
    workspaceId: auth.apiKey.workspaceId,
    apiKeyId: auth.apiKey.id,
    httpRequestId: ids.httpRequestId,
    correlationId: ids.correlationId,
    method: "GET",
    path: "/api/v1/public/schema",
    statusCode: 200,
    durationMs: Date.now() - started,
  }).catch(() => undefined);

  return integrationJsonResponse({
    body,
    status: 200,
    ids,
    headers: buildCorsHeaders(auth.apiKey, request),
  });
}
