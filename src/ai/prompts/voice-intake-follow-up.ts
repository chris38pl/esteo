import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";
import {
  buildVoiceIntakeFollowUpPatchRules,
  buildVoiceIntakeSharedRules,
} from "@/ai/prompts/voice-intake-shared-rules";
import type { Locale } from "@/lib/locale";

export function buildVoiceIntakeFollowUpPrompt(input: {
  previousTranscript: string;
  previousExtraction: VoiceIntakeExtraction;
  followUpTranscript: string;
  missingFieldLabels: string[];
  transcriptLocale: Locale;
  outputTextLocale: Locale;
  referenceDate?: Date;
}): string {
  const referenceDate = input.referenceDate ?? new Date();
  const sharedRules = buildVoiceIntakeSharedRules({
    referenceDate,
    transcriptLocale: input.transcriptLocale,
    outputTextLocale: input.outputTextLocale,
  });
  const patchRules = buildVoiceIntakeFollowUpPatchRules();

  return `You update a structured estimate-request extraction based on a short follow-up recording.

The user was asked to provide ONLY missing information.

${patchRules}

${sharedRules}

Fields the user was told were missing:
${input.missingFieldLabels.map((l) => `- ${l}`).join("\n")}

Previous transcript:
"""
${input.previousTranscript.trim()}
"""

Previous extraction JSON:
${JSON.stringify(input.previousExtraction, null, 2)}

Follow-up transcript:
"""
${input.followUpTranscript.trim()}
"""`;
}
