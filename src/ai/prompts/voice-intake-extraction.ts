import {
  buildVoiceIntakeSharedRules,
} from "@/ai/prompts/voice-intake-shared-rules";
import type { Locale } from "@/lib/locale";

export type VoiceIntakeFieldDefinitionSummary = {
  key: string;
  label: string;
  valueType: string;
  required: boolean;
  options?: { value: string; label: string }[];
};

export function buildVoiceIntakeExtractionPrompt(input: {
  transcript: string;
  transcriptLocale: Locale;
  outputTextLocale: Locale;
  referenceDate?: Date;
  fieldDefinitions: VoiceIntakeFieldDefinitionSummary[];
}): string {
  const referenceDate = input.referenceDate ?? new Date();
  const sharedRules = buildVoiceIntakeSharedRules({
    referenceDate,
    transcriptLocale: input.transcriptLocale,
    outputTextLocale: input.outputTextLocale,
  });

  return `You extract structured estimate-request data from spoken project descriptions for construction, renovation, and finishing work.

Return ONLY valid JSON matching the schema.

${sharedRules}

Additional field rules:
- area is in square meters (m²) as a number.
- projectSummary.value: 3-5 sentences, natural language, no marketing, no "AI" buzzwords.
- projectSummary.bullets: 3-7 short UI bullet labels (max 8 words each).
- generatedTitle: max 60 characters, format "[work type] [area?] – [city]", professional, no marketing words.
- ambiguities: list fields where multiple conflicting values were mentioned.
- locale field in JSON: set to "${input.outputTextLocale}".

Workspace industry fields:
${JSON.stringify(input.fieldDefinitions, null, 2)}

Transcript:
"""
${input.transcript.trim()}
"""`;
}
