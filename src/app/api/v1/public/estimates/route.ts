import "server-only";

import { createCorrelationIds } from "@/server/integrations/http/correlation";
import {
  authenticateIntegrationRequest,
  buildCorsHeaders,
} from "@/server/integrations/http/auth";
import { integrationErrorResponse } from "@/server/integrations/http/errors";
import { resolveIntegrationLocale } from "@/server/integrations/http/locale";

export const runtime = "nodejs";

/** Scaffold - create estimate (not implemented in v1 MVP). */
export async function POST(request: Request) {
  const ids = createCorrelationIds(request);
  const locale = resolveIntegrationLocale(request);
  const auth = await authenticateIntegrationRequest(request);

  if (!auth.ok) {
    return integrationErrorResponse({
      code: auth.code,
      locale,
      status: auth.status,
      ids,
      details: auth.details,
    });
  }

  return integrationErrorResponse({
    code: "NOT_IMPLEMENTED",
    locale,
    status: 501,
    ids,
    headers: buildCorsHeaders(auth.apiKey, request),
  });
}
