import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

import { normalizeVoiceIntakeExtraction } from "@/ai/lib/voice-intake-normalization";
import {
  buildVoiceIntakeExtractionPrompt,
  type VoiceIntakeFieldDefinitionSummary,
} from "@/ai/prompts/voice-intake-extraction";
import { buildVoiceIntakeFollowUpPrompt } from "@/ai/prompts/voice-intake-follow-up";
import {
  voiceIntakeExtractionSchema,
  type VoiceIntakeExtraction,
} from "@/ai/schemas/voice-intake-extraction";
import { stabilizeVoiceIntakeMerge } from "@/ai/services/stabilize-voice-intake-merge";
import type { WorkspaceIndustry } from "@prisma/client";
import type { Locale } from "@/lib/locale";

export async function extractVoiceIntake(input: {
  transcript: string;
  transcriptLocale: Locale;
  outputTextLocale: Locale;
  referenceDate?: Date;
  fieldDefinitions: VoiceIntakeFieldDefinitionSummary[];
  industry: WorkspaceIndustry;
  industryOtherText?: string | null;
  useFallbackModel?: boolean;
}): Promise<VoiceIntakeExtraction> {
  const prompt = buildVoiceIntakeExtractionPrompt({
    transcript: input.transcript,
    transcriptLocale: input.transcriptLocale,
    outputTextLocale: input.outputTextLocale,
    referenceDate: input.referenceDate,
    fieldDefinitions: input.fieldDefinitions,
    industry: input.industry,
    industryOtherText: input.industryOtherText,
  });

  const { object } = await generateObject({
    model: openai(input.useFallbackModel ? "gpt-4o" : "gpt-4o-mini"),
    schema: voiceIntakeExtractionSchema,
    schemaName: "VoiceIntakeExtraction",
    schemaDescription: "Structured fields extracted from a spoken estimate request.",
    prompt,
  });

  return postProcessExtraction(object, input.transcript);
}

export async function extractVoiceIntakeFollowUp(input: {
  previousTranscript: string;
  previousExtraction: VoiceIntakeExtraction;
  followUpTranscript: string;
  missingFieldLabels: string[];
  missingFieldKeys: string[];
  transcriptLocale: Locale;
  outputTextLocale: Locale;
  referenceDate?: Date;
  fieldDefinitions: VoiceIntakeFieldDefinitionSummary[];
  useFallbackModel?: boolean;
}): Promise<VoiceIntakeExtraction> {
  const prompt = buildVoiceIntakeFollowUpPrompt({
    previousTranscript: input.previousTranscript,
    previousExtraction: input.previousExtraction,
    followUpTranscript: input.followUpTranscript,
    missingFieldLabels: input.missingFieldLabels,
    transcriptLocale: input.transcriptLocale,
    outputTextLocale: input.outputTextLocale,
    referenceDate: input.referenceDate,
  });

  const { object } = await generateObject({
    model: openai(input.useFallbackModel ? "gpt-4o" : "gpt-4o-mini"),
    schema: voiceIntakeExtractionSchema,
    schemaName: "VoiceIntakeExtraction",
    schemaDescription: "Updated extraction after follow-up recording.",
    prompt,
  });

  const combinedTranscript = `${input.previousTranscript}\n${input.followUpTranscript}`;
  const normalizedNext = postProcessExtraction(object, combinedTranscript);

  return stabilizeVoiceIntakeMerge({
    previous: input.previousExtraction,
    next: normalizedNext,
    missingFieldKeys: input.missingFieldKeys,
    followUpTranscript: input.followUpTranscript,
  });
}

function postProcessExtraction(
  extraction: VoiceIntakeExtraction,
  transcript: string,
): VoiceIntakeExtraction {
  let result = { ...extraction };

  if (result.generatedTitle.value) {
    result.generatedTitle = {
      ...result.generatedTitle,
      value: truncateTitle(stripMarketingWords(result.generatedTitle.value)),
    };
  }

  if (result.postalCode.value) {
    result.postalCode = {
      ...result.postalCode,
      value: normalizePostalCode(result.postalCode.value),
    };
  }

  result = normalizeVoiceIntakeExtraction({ extraction: result, transcript });

  return result;
}

function truncateTitle(value: string, max = 60): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).trimEnd();
}

const MARKETING_WORDS =
  /\b(ai|innowacyjny|innowacyjna|kompleksowy|kompleksowa|profesjonalny|profesjonalna)\b/gi;

function stripMarketingWords(value: string): string {
  return value.replace(MARKETING_WORDS, "").replace(/\s+/g, " ").trim();
}

function normalizePostalCode(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 5) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  return value.trim();
}
