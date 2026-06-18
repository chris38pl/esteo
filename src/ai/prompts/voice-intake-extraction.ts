import {
  buildVoiceIntakeSharedRules,
} from "@/ai/prompts/voice-intake-shared-rules";
import { isServiceWorkspace } from "@/features/workspaces/lib/industries";
import type { WorkspaceIndustry } from "@prisma/client";
import type { Locale } from "@/lib/locale";

export type VoiceIntakeFieldDefinitionSummary = {
  key: string;
  label: string;
  valueType: string;
  required: boolean;
  options?: { value: string; label: string }[];
};

function buildServicesExtractionIntro(industryOtherText: string | null | undefined): string {
  const businessTypeBlock =
    industryOtherText?.trim()
      ? `\nBusiness Type: ${industryOtherText.trim()}`
      : "";

  return `You extract structured quote-request data from spoken service descriptions (events, creative services, consulting, trades, and other professional services).

Do NOT ask for or require property type, floor area, or construction-specific fields unless clearly relevant to the brief.
Focus on: service description, scope, service location/venue, preferred timeline, and contact details.${businessTypeBlock}`;
}

export function buildVoiceIntakeExtractionPrompt(input: {
  transcript: string;
  transcriptLocale: Locale;
  outputTextLocale: Locale;
  referenceDate?: Date;
  fieldDefinitions: VoiceIntakeFieldDefinitionSummary[];
  industry: WorkspaceIndustry;
  industryOtherText?: string | null;
}): string {
  const referenceDate = input.referenceDate ?? new Date();
  const sharedRules = buildVoiceIntakeSharedRules({
    referenceDate,
    transcriptLocale: input.transcriptLocale,
    outputTextLocale: input.outputTextLocale,
    includeConstructionFields: !isServiceWorkspace(input.industry),
  });

  const intro = isServiceWorkspace(input.industry)
    ? buildServicesExtractionIntro(input.industryOtherText)
    : `You extract structured estimate-request data from spoken project descriptions for construction, renovation, and finishing work.`;

  const titleRule = isServiceWorkspace(input.industry)
    ? "- generatedTitle: max 60 characters, professional summary of the service request, no marketing words."
    : '- generatedTitle: max 60 characters, format "[work type] [area?] – [city]", professional, no marketing words.';

  const areaRule = isServiceWorkspace(input.industry)
    ? "- Ignore floor area (m²) unless the customer explicitly mentions it."
    : "- area is in square meters (m²) as a number.";

  return `${intro}

Return ONLY valid JSON matching the schema.

${sharedRules}

Additional field rules:
${areaRule}
- projectSummary.value: 3-5 sentences, natural language, no marketing, no "AI" buzzwords.
- projectSummary.bullets: 3-7 short UI bullet labels (max 8 words each).
${titleRule}
- ambiguities: list fields where multiple conflicting values were mentioned.
- locale field in JSON: set to "${input.outputTextLocale}".
- For service location, populate city with venue/place name and city when mentioned (e.g. "Sala Magnolia, Poznań").

Workspace industry fields:
${JSON.stringify(input.fieldDefinitions, null, 2)}

Transcript:
"""
${input.transcript.trim()}
"""`;
}
