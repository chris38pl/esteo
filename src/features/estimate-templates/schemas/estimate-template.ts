import { z } from "zod";

import {
  ESTIMATE_TEMPLATE_DESCRIPTION_MAX_LENGTH,
  ESTIMATE_TEMPLATE_GUIDANCE_MAX_LENGTH,
  ESTIMATE_TEMPLATE_ITEM_NAME_MAX_LENGTH,
  ESTIMATE_TEMPLATE_NAME_MAX_LENGTH,
  ESTIMATE_TEMPLATE_SECTION_TITLE_MAX_LENGTH,
} from "@/features/estimate-templates/lib/template-limits";

export const estimateTemplateItemInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(ESTIMATE_TEMPLATE_ITEM_NAME_MAX_LENGTH),
  unit: z.string().trim().max(24).optional().nullable(),
  guidance: z
    .string()
    .trim()
    .max(ESTIMATE_TEMPLATE_GUIDANCE_MAX_LENGTH)
    .optional()
    .nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export const estimateTemplateSectionInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1).max(ESTIMATE_TEMPLATE_SECTION_TITLE_MAX_LENGTH),
  guidance: z
    .string()
    .trim()
    .max(ESTIMATE_TEMPLATE_GUIDANCE_MAX_LENGTH)
    .optional()
    .nullable(),
  sortOrder: z.number().int().min(0).optional(),
  items: z
    .array(estimateTemplateItemInputSchema)
    .default([]),
});

export const estimateTemplateInputSchema = z.object({
  name: z.string().trim().min(1).max(ESTIMATE_TEMPLATE_NAME_MAX_LENGTH),
  description: z
    .string()
    .trim()
    .max(ESTIMATE_TEMPLATE_DESCRIPTION_MAX_LENGTH)
    .optional()
    .nullable(),
  sections: z.array(estimateTemplateSectionInputSchema).min(1),
});

export type EstimateTemplateInput = z.infer<typeof estimateTemplateInputSchema>;
