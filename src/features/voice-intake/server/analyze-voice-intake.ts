import "server-only";

import type { VoiceIntakeFieldDefinitionSummary } from "@/ai/prompts/voice-intake-extraction";
import {
  extractVoiceIntake,
  extractVoiceIntakeFollowUp,
} from "@/ai/services/extract-voice-intake";
import { transcribeAudio } from "@/ai/services/transcribe-audio";
import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";
import { cleanVoiceTranscript } from "@/ai/lib/clean-voice-transcript";
import { computeOverallConfidence } from "@/features/voice-intake/lib/build-confidence-summary";
import { buildTitleFromExtraction } from "@/features/voice-intake/lib/build-title-from-extraction";
import { validateVoiceAudio } from "@/features/voice-intake/server/validate-audio";
import type { WorkspaceIndustry } from "@prisma/client";
import type { Locale } from "@/lib/locale";

export type FollowUpContext = {
  previousTranscript: string;
  initialTranscript: string;
  previousExtraction: VoiceIntakeExtraction;
  missingFieldLabels: string[];
  missingFieldKeys: string[];
};

export async function analyzeVoiceIntake(input: {
  audioBuffer: Buffer;
  filename: string;
  durationMs: number;
  locale: Locale;
  outputTextLocale?: Locale;
  fieldDefinitions: VoiceIntakeFieldDefinitionSummary[];
  industry: WorkspaceIndustry;
  industryOtherText?: string | null;
  followUpContext?: FollowUpContext;
}) {
  const transcriptLocale = input.locale;
  const outputTextLocale = input.outputTextLocale ?? input.locale;
  const isFollowUp = Boolean(input.followUpContext);

  const audioValidation = validateVoiceAudio({
    buffer: input.audioBuffer,
    durationMs: input.durationMs,
    isFollowUp,
  });

  if (!audioValidation.ok) {
    throw new VoiceIntakeAnalysisError(audioValidation.code);
  }

  let transcript: string;

  try {
    transcript = await transcribeAudio({
      audioBuffer: input.audioBuffer,
      filename: input.filename,
      locale: input.locale,
    });
  } catch {
    throw new VoiceIntakeAnalysisError("transcription_failed");
  }

  if (transcript.length < 10) {
    throw new VoiceIntakeAnalysisError("empty_audio");
  }

  let extraction: VoiceIntakeExtraction;
  let combinedTranscript: string;
  const initialTranscript = transcript;
  let followUpTranscript: string | undefined;

  async function runExtraction(useFallback: boolean) {
    if (input.followUpContext) {
      followUpTranscript = initialTranscript;
      return extractVoiceIntakeFollowUp({
        previousTranscript: input.followUpContext.previousTranscript,
        previousExtraction: input.followUpContext.previousExtraction,
        followUpTranscript: initialTranscript,
        missingFieldLabels: input.followUpContext.missingFieldLabels,
        missingFieldKeys: input.followUpContext.missingFieldKeys,
        transcriptLocale,
        outputTextLocale,
        fieldDefinitions: input.fieldDefinitions,
        useFallbackModel: useFallback,
      });
    }

    return extractVoiceIntake({
      transcript: initialTranscript,
      transcriptLocale,
      outputTextLocale,
      fieldDefinitions: input.fieldDefinitions,
      industry: input.industry,
      industryOtherText: input.industryOtherText,
      useFallbackModel: useFallback,
    });
  }

  try {
    extraction = await runExtraction(false);
  } catch {
    try {
      extraction = await runExtraction(true);
    } catch {
      throw new VoiceIntakeAnalysisError("extraction_failed");
    }
  }

  if (input.followUpContext) {
    transcript = input.followUpContext.initialTranscript;
    const previousChain = input.followUpContext.previousTranscript.trim();
    combinedTranscript = previousChain
      ? `${previousChain}\n\n${followUpTranscript ?? ""}`.trim()
      : (followUpTranscript ?? "");
  } else {
    combinedTranscript = initialTranscript;
    transcript = initialTranscript;
  }

  const cleanedTranscript = cleanVoiceTranscript(combinedTranscript);
  const displayTitle = buildTitleFromExtraction(
    extraction,
    outputTextLocale,
    input.industry,
  );
  const overallConfidence = computeOverallConfidence(extraction);

  return {
    transcript,
    followUpTranscript,
    combinedTranscript,
    cleanedTranscript,
    displayTitle,
    extraction,
    overallConfidence,
  };
}

export class VoiceIntakeAnalysisError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "VoiceIntakeAnalysisError";
  }
}
