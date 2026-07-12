import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { clientRouter } from "@/server/client-api/root";
import { createTRPCContext } from "@/server/trpc/context";
import { checkSlidingWindowRateLimit } from "@/server/rate-limit/memory";

export const runtime = "nodejs";

/**
 * Browser-based clients (e.g. Expo web) enforce CORS; native React Native does
 * not. Allowed origins are env-driven (`CLIENT_API_ALLOWED_ORIGINS`,
 * comma-separated). When unset, no CORS headers are emitted (same-origin only).
 */
const ALLOWED_ORIGINS = (process.env.CLIENT_API_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const RATE_LIMIT = Number(process.env.CLIENT_API_RATE_LIMIT ?? 120);
const RATE_WINDOW_MS = 60_000;

function corsHeaders(origin: string | null): Headers {
  const headers = new Headers();
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set(
      "Access-Control-Allow-Headers",
      "authorization, content-type, x-locale, x-trpc-source",
    );
  }
  return headers;
}

function rateLimitKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `client-api:${ip}`;
}

async function handler(request: Request) {
  const origin = request.headers.get("origin");
  const cors = corsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const limit = checkSlidingWindowRateLimit({
    key: rateLimitKey(request),
    limit: RATE_LIMIT,
    windowMs: RATE_WINDOW_MS,
  });
  if (!limit.allowed) {
    const headers = new Headers(cors);
    headers.set("Retry-After", String(Math.ceil(limit.retryAfterMs / 1000)));
    headers.set("content-type", "application/json");
    return new Response(JSON.stringify({ error: "Too many requests." }), {
      status: 429,
      headers,
    });
  }

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: clientRouter,
    createContext: () => createTRPCContext({ headers: request.headers }),
  });

  cors.forEach((value, key) => response.headers.set(key, value));
  return response;
}

export { handler as GET, handler as POST, handler as OPTIONS };
