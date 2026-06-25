import { z } from "zod/v3";

import { nullableString } from "@/ai/schemas/structured-output";

const templateGenerationItemSchema = z.object({
  name: z.string(),
  unit: nullableString(),
  guidance: nullableString(),
  sortOrder: z.number().int(),
});

const templateGenerationSectionSchema = z.object({
  title: z.string(),
  guidance: nullableString(),
  sortOrder: z.number().int(),
  items: z.array(templateGenerationItemSchema),
});

export const templateGenerationOutputSchema = z.object({
  name: z.string(),
  description: nullableString(),
  sections: z.array(templateGenerationSectionSchema),
});

export type TemplateGenerationOutput = z.infer<typeof templateGenerationOutputSchema>;
