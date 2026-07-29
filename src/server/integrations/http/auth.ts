import "server-only";

import type { WorkspaceApiKey } from "@prisma/client";

import {
  findActiveApiKeyByPlaintext,
  touchApiKeyLastUsed,
} from "@/server/integrations/keys/service";
import { INTEGRATION_API_SCOPE_REQUESTS_WRITE } from "@/server/integrations/version";
import { getFeatureState } from "@/server/billing/entitlement-service";
import { checkSlidingWindowRateLimit } from "@/server/rate-limit/memory";
import type { IntegrationErrorCode } from "@/server/integrations/i18n/errors";

export type AuthenticatedApiKey = NonNullable<
  Awaited<ReturnType<typeof findActiveApiKeyByPlaintext>>
>;

export type AuthFailure = {
  ok: false;
  code: IntegrationErrorCode;
  status: number;
  details?: Record<string, unknown>;
  retryAfterSeconds?: number;
};

export type AuthSuccess = {
  ok: true;
  apiKey: AuthenticatedApiKey;
  plaintext: string;
};

function extractBearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function requestOrigin(request: Request): string | null {
  const origin = request.headers.get("origin")?.trim();
  if (origin) {
    return origin.replace(/\/$/, "");
  }
  const referer = request.headers.get("referer")?.trim();
  if (!referer) {
    return null;
  }
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

function assertOriginAllowed(apiKey: WorkspaceApiKey, request: Request): AuthFailure | null {
  if (apiKey.allowedOrigins.length === 0) {
    return null;
  }

  const origin = requestOrigin(request);
  // Server-to-server calls often omit Origin - allow when no browser origin present.
  if (!origin) {
    return null;
  }

  if (!apiKey.allowedOrigins.includes(origin)) {
    return {
      ok: false,
      code: "FORBIDDEN_ORIGIN",
      status: 403,
      details: { origin, allowedOrigins: apiKey.allowedOrigins },
    };
  }

  return null;
}

function assertIpAllowed(apiKey: WorkspaceApiKey, request: Request): AuthFailure | null {
  if (apiKey.allowedIps.length === 0) {
    return null;
  }

  const ip = clientIp(request);
  if (!apiKey.allowedIps.includes(ip)) {
    return {
      ok: false,
      code: "FORBIDDEN_IP",
      status: 403,
      details: { ip, allowedIps: apiKey.allowedIps },
    };
  }

  return null;
}

function assertRateLimit(apiKey: WorkspaceApiKey): AuthFailure | null {
  const minute = checkSlidingWindowRateLimit({
    key: `integration:key:${apiKey.id}:min`,
    limit: apiKey.rateLimitPerMinute,
    windowMs: 60_000,
  });

  if (!minute.allowed) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      status: 429,
      retryAfterSeconds: Math.ceil(minute.retryAfterMs / 1000),
      details: {
        window: "minute",
        limit: apiKey.rateLimitPerMinute,
      },
    };
  }

  const day = checkSlidingWindowRateLimit({
    key: `integration:key:${apiKey.id}:day`,
    limit: apiKey.rateLimitPerDay,
    windowMs: 24 * 60 * 60 * 1000,
  });

  if (!day.allowed) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      status: 429,
      retryAfterSeconds: Math.ceil(day.retryAfterMs / 1000),
      details: {
        window: "day",
        limit: apiKey.rateLimitPerDay,
      },
    };
  }

  return null;
}

export async function authenticateIntegrationRequest(
  request: Request,
  requiredScope: string = INTEGRATION_API_SCOPE_REQUESTS_WRITE,
): Promise<AuthSuccess | AuthFailure> {
  const plaintext = extractBearer(request);
  if (!plaintext) {
    return { ok: false, code: "INVALID_API_KEY", status: 401 };
  }

  const apiKey = await findActiveApiKeyByPlaintext(plaintext);
  if (!apiKey) {
    return { ok: false, code: "INVALID_API_KEY", status: 401 };
  }

  const featureState = await getFeatureState(apiKey.workspaceId, "INTEGRATIONS");
  if (featureState !== "ACTIVE") {
    return { ok: false, code: "FORBIDDEN_PLAN", status: 403 };
  }

  if (!apiKey.scopes.includes(requiredScope)) {
    return {
      ok: false,
      code: "FORBIDDEN_SCOPE",
      status: 403,
      details: { requiredScope, scopes: apiKey.scopes },
    };
  }

  const originFailure = assertOriginAllowed(apiKey, request);
  if (originFailure) {
    return originFailure;
  }

  const ipFailure = assertIpAllowed(apiKey, request);
  if (ipFailure) {
    return ipFailure;
  }

  const rateFailure = assertRateLimit(apiKey);
  if (rateFailure) {
    return rateFailure;
  }

  void touchApiKeyLastUsed(apiKey.id);

  return { ok: true, apiKey, plaintext };
}

export function getClientIp(request: Request): string {
  return clientIp(request);
}

export function buildCorsHeaders(apiKey: WorkspaceApiKey, request: Request): HeadersInit {
  const origin = requestOrigin(request);
  if (!origin) {
    return {};
  }

  if (apiKey.allowedOrigins.length > 0 && !apiKey.allowedOrigins.includes(origin)) {
    return {};
  }

  // When allowlist is empty, reflect Origin for browser convenience (key still required).
  if (apiKey.allowedOrigins.length === 0 || apiKey.allowedOrigins.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      Vary: "Origin",
      "Access-Control-Allow-Headers":
        "Authorization, Content-Type, Idempotency-Key, Accept-Language, X-Request-Id, X-Correlation-Id",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    };
  }

  return {};
}
