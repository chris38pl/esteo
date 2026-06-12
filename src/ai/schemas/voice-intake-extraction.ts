import { z } from "zod/v3";

import { nullableNumber, nullableString } from "@/ai/schemas/structured-output";

const confidence = () => z.number().min(0).max(1);

function confidenceField<T extends z.ZodTypeAny>(valueSchema: T) {
  return z.object({
    value: valueSchema,
    confidence: confidence(),
  });
}

const propertyTypeEnum = z.union([
  z.enum(["apartment", "house", "office", "commercial", "other"]),
  z.null(),
]);

const preferredStartDateEnum = z.union([
  z.enum(["asap", "1_3_months", "3_6_months", "6_12_months", "flexible"]),
  z.null(),
]);

export const voiceIntakeExtractionSchema = z.object({
  projectSummary: z.object({
    value: nullableString(),
    bullets: z.array(
      z.object({
        label: z.string(),
        confidence: confidence(),
      }),
    ),
    confidence: confidence(),
  }),
  generatedTitle: z.object({
    value: nullableString(),
    confidence: confidence(),
  }),
  description: confidenceField(nullableString()),
  propertyType: confidenceField(propertyTypeEnum),
  address: confidenceField(nullableString()),
  city: confidenceField(nullableString()),
  postalCode: confidenceField(nullableString()),
  voivodeship: confidenceField(nullableString()),
  area: confidenceField(nullableNumber()),
  preferredStartDate: confidenceField(preferredStartDateEnum),
  fullName: confidenceField(nullableString()),
  email: confidenceField(nullableString()),
  phone: confidenceField(nullableString()),
  scopeOfWork: z.object({
    items: z.array(
      z.object({
        label: z.string(),
        confidence: confidence(),
      }),
    ),
    confidence: confidence(),
  }),
  ambiguities: z.array(
    z.object({
      field: z.string(),
      candidates: z.array(z.string()),
      reason: nullableString(),
    }),
  ),
  locale: z.enum(["pl", "en"]),
});

export type VoiceIntakeExtraction = z.infer<typeof voiceIntakeExtractionSchema>;

export type ConfidenceField<T> = {
  value: T;
  confidence: number;
};
