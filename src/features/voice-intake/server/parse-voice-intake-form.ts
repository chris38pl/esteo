import { WorkspaceIndustry } from "@prisma/client";
import { z } from "zod";

import type { VoiceIntakeFieldDefinitionSummary } from "@/ai/prompts/voice-intake-extraction";
import type { FollowUpContext } from "@/features/voice-intake/server/analyze-voice-intake";
import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";

const fieldDefinitionSchema = z.array(
  z.object({
    key: z.string(),
    label: z.string(),
    valueType: z.string(),
    required: z.boolean(),
    options: z
      .array(
        z.object({
          value: z.string(),
          label: z.string(),
        }),
      )
      .optional(),
  }),
);

const followUpContextSchema = z.object({
  previousTranscript: z.string().min(1),
  initialTranscript: z.string().min(1),
  previousExtraction: z.custom<VoiceIntakeExtraction>(),
  missingFieldLabels: z.array(z.string()),
  missingFieldKeys: z.array(z.string()),
});

export function parseFieldDefinitions(raw: FormDataEntryValue | null): VoiceIntakeFieldDefinitionSummary[] {
  if (typeof raw !== "string") {
    return [];
  }

  try {
    const parsed = fieldDefinitionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function parseFollowUpContext(raw: FormDataEntryValue | null): FollowUpContext | undefined {
  if (typeof raw !== "string") {
    return undefined;
  }

  try {
    const parsed = followUpContextSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export function parseDurationMs(raw: FormDataEntryValue | null, fallback = 0): number {
  if (typeof raw !== "string") {
    return fallback;
  }

  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : fallback;
}

const workspaceIndustrySchema = z.nativeEnum(WorkspaceIndustry);

export type VoiceIntakeWorkspaceContext = {
  industry: WorkspaceIndustry;
  industryOtherText: string | null;
};

export function parseVoiceIntakeWorkspaceContext(input: {
  industry: FormDataEntryValue | null;
  industryOtherText: FormDataEntryValue | null;
}): VoiceIntakeWorkspaceContext {
  const industryParsed = workspaceIndustrySchema.safeParse(input.industry);
  const industry = industryParsed.success
    ? industryParsed.data
    : WorkspaceIndustry.CONSTRUCTION;

  const industryOtherText =
    typeof input.industryOtherText === "string" && input.industryOtherText.trim().length > 0
      ? input.industryOtherText.trim()
      : null;

  return { industry, industryOtherText };
}
