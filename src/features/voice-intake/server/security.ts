import { checkSlidingWindowRateLimit } from "@/server/rate-limit/memory";

const PUBLIC_VOICE_LIMIT = 5;
const INTERNAL_VOICE_LIMIT = 20;
const VOICE_WINDOW_MS = 60 * 60 * 1000;

export function assertPublicVoiceIntakeRateLimit(input: { workspaceSlug: string; ip: string }) {
  const result = checkSlidingWindowRateLimit({
    key: `voice-intake:public:${input.workspaceSlug}:${input.ip}`,
    limit: PUBLIC_VOICE_LIMIT,
    windowMs: VOICE_WINDOW_MS,
  });

  if (!result.allowed) {
    throw new Error("RATE_LIMITED");
  }
}

export function assertInternalVoiceIntakeRateLimit(input: { userId: string }) {
  const result = checkSlidingWindowRateLimit({
    key: `voice-intake:internal:${input.userId}`,
    limit: INTERNAL_VOICE_LIMIT,
    windowMs: VOICE_WINDOW_MS,
  });

  if (!result.allowed) {
    throw new Error("RATE_LIMITED");
  }
}
