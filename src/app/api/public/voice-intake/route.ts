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
import { assertPublicVoiceIntakeRateLimit } from "@/features/voice-intake/server/security";
import {
  getPublicRequestFingerprint,
  verifyEstimateRequestCaptcha,
} from "@/features/estimate-requests/server/security";
import { isLocale, type Locale } from "@/lib/locale";
import { prisma } from "@/db/client";

export const runtime = "nodejs";

function errorJson(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");
    const workspaceSlug = formData.get("workspaceSlug");
    const captchaToken = formData.get("captchaToken");
    const durationMs = parseDurationMs(formData.get("durationMs"));
    const fieldDefinitions = parseFieldDefinitions(formData.get("fieldDefinitions"));
    const followUpContext = parseFollowUpContext(formData.get("followUpContext"));

    if (!(audio instanceof File) || typeof workspaceSlug !== "string") {
      return errorJson("invalid", 400);
    }

    const workspace = await prisma.workspace.findFirst({
      where: { slug: workspaceSlug, deletedAt: null },
      select: { id: true },
    });

    if (!workspace) {
      return errorJson("invalid", 400);
    }

    const fingerprint = await getPublicRequestFingerprint();

    assertPublicVoiceIntakeRateLimit({
      workspaceSlug,
      ip: fingerprint.ip,
    });

    const captcha = await verifyEstimateRequestCaptcha(
      typeof captchaToken === "string" ? captchaToken : null,
    );

    if (!captcha.ok) {
      return errorJson("captcha_failed", 403);
    }

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

    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return errorJson("rate_limited", 429);
    }

    console.error("[public/voice-intake]", error);
    return errorJson("unavailable", 503);
  }
}
