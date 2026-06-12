import "server-only";

import { NextResponse } from "next/server";

import {
  analyzeVoiceIntake,
  VoiceIntakeAnalysisError,
} from "@/features/voice-intake/server/analyze-voice-intake";
import {
  parseDurationMs,
  parseFieldDefinitions,
  parseFollowUpContext,
} from "@/features/voice-intake/server/parse-voice-intake-form";
import { assertInternalVoiceIntakeRateLimit } from "@/features/voice-intake/server/security";
import { syncUserFromClerk } from "@/server/auth/sync-user";
import { isLocale, type Locale } from "@/lib/locale";
import {
  assertCanUseAiAssistant,
  incrementAiAssistantUsage,
} from "@/server/permissions/entitlements";
import { EntitlementError, PermissionError } from "@/server/permissions/errors";
import { requireRole } from "@/server/permissions/require-workspace";

export const runtime = "nodejs";

function errorJson(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  try {
    const user = await syncUserFromClerk();

    if (!user) {
      return errorJson("unauthorized", 401);
    }

    const formData = await request.formData();
    const audio = formData.get("audio");
    const workspaceId = formData.get("workspaceId");
    const durationMs = parseDurationMs(formData.get("durationMs"));
    const fieldDefinitions = parseFieldDefinitions(formData.get("fieldDefinitions"));
    const followUpContext = parseFollowUpContext(formData.get("followUpContext"));

    if (!(audio instanceof File) || typeof workspaceId !== "string") {
      return errorJson("invalid", 400);
    }

    await requireRole(user, workspaceId, "MEMBER");

    assertInternalVoiceIntakeRateLimit({ userId: user.id });
    await assertCanUseAiAssistant(user.id);

    const localeParam = new URL(request.url).searchParams.get("locale");
    const locale: Locale =
      localeParam !== null && isLocale(localeParam) ? localeParam : "pl";

    const buffer = Buffer.from(await audio.arrayBuffer());

    const result = await analyzeVoiceIntake({
      audioBuffer: buffer,
      filename: audio.name || "recording.webm",
      durationMs,
      locale,
      fieldDefinitions,
      followUpContext,
    });

    await incrementAiAssistantUsage(user.id);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof VoiceIntakeAnalysisError) {
      const status =
        error.code === "rate_limited"
          ? 429
          : error.code === "audio_too_large"
            ? 413
            : 400;
      return errorJson(error.code, status);
    }

    if (error instanceof PermissionError) {
      return errorJson("unauthorized", 403);
    }

    if (error instanceof EntitlementError) {
      return errorJson("entitlement_exceeded", 403);
    }

    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return errorJson("rate_limited", 429);
    }

    console.error("[estimate-requests/voice-intake]", error);
    return errorJson("unavailable", 503);
  }
}
