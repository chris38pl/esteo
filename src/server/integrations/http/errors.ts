import { NextResponse } from "next/server";

import type { Locale } from "@/lib/locale";
import {
  applyCorrelationHeaders,
  type CorrelationIds,
} from "@/server/integrations/http/correlation";
import {
  getIntegrationErrorCopy,
  type IntegrationErrorCode,
} from "@/server/integrations/i18n/errors";

export type IntegrationErrorBody = {
  code: IntegrationErrorCode;
  message: string;
  suggestion: string;
  details?: Record<string, unknown>;
};

export function integrationErrorResponse(input: {
  code: IntegrationErrorCode;
  locale: Locale;
  status: number;
  details?: Record<string, unknown>;
  /** Overrides the default i18n message (e.g. field-level validation summary). */
  message?: string;
  ids: CorrelationIds;
  headers?: HeadersInit;
  retryAfterSeconds?: number;
}): NextResponse {
  const copy = getIntegrationErrorCopy(input.code, input.locale);
  const body: IntegrationErrorBody = {
    code: input.code,
    message: input.message ?? copy.message,
    suggestion: copy.suggestion,
    ...(input.details ? { details: input.details } : {}),
  };

  const headers = new Headers(input.headers);
  applyCorrelationHeaders(headers, input.ids);
  if (input.retryAfterSeconds !== undefined) {
    headers.set("Retry-After", String(input.retryAfterSeconds));
  }

  return NextResponse.json(body, { status: input.status, headers });
}

export function integrationJsonResponse(input: {
  body: unknown;
  status: number;
  ids: CorrelationIds;
  headers?: HeadersInit;
}): NextResponse {
  const headers = new Headers(input.headers);
  applyCorrelationHeaders(headers, input.ids);
  return NextResponse.json(input.body, { status: input.status, headers });
}
