import { headers } from "next/headers";

import { checkSlidingWindowRateLimit } from "@/server/rate-limit/memory";

const SUBMIT_LIMIT = 8;
const SUBMIT_WINDOW_MS = 60 * 60 * 1000;

export async function getPublicRequestFingerprint() {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headersList.get("x-real-ip")?.trim();
  const ip = forwardedFor || realIp || "unknown";
  const userAgent = headersList.get("user-agent")?.slice(0, 180) ?? "unknown";

  return { ip, userAgent };
}

export function assertPublicSubmitRateLimit(input: { workspaceSlug: string; ip: string }) {
  const result = checkSlidingWindowRateLimit({
    key: `estimate-request:${input.workspaceSlug}:${input.ip}`,
    limit: SUBMIT_LIMIT,
    windowMs: SUBMIT_WINDOW_MS,
  });

  if (!result.allowed) {
    throw new Error("RATE_LIMITED");
  }
}

export function isHoneypotFilled(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

export async function verifyEstimateRequestCaptcha(token: string | undefined | null) {
  const secret = process.env.ESTIMATE_REQUEST_TURNSTILE_SECRET_KEY;

  if (!secret) {
    return { ok: true, skipped: true };
  }

  if (!token) {
    return { ok: false, skipped: false };
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret,
      response: token,
    }),
  });

  if (!response.ok) {
    return { ok: false, skipped: false };
  }

  const payload = (await response.json()) as { success?: boolean };
  return { ok: payload.success === true, skipped: false };
}
