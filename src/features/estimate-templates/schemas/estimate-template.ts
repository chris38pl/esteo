import { z } from "zod";

import {
  ESTIMATE_TEMPLATE_DESCRIPTION_MAX_LENGTH,
  ESTIMATE_TEMPLATE_GUIDANCE_MAX_LENGTH,
  ESTIMATE_TEMPLATE_ITEM_NAME_MAX_LENGTH,
  ESTIMATE_TEMPLATE_NAME_MAX_LENGTH,
  ESTIMATE_TEMPLATE_SECTION_TITLE_MAX_LENGTH,
} from "@/features/estimate-templates/lib/template-limits";
import {
  ESTIMATE_TEMPLATE_ITEM_NOTE_MAX_LENGTH,
  TEMPLATE_CURRENCY_LENGTH,
} from "@/features/estimate-templates/lib/template-pricing";
import { isTemplateDecimalValue, normalizeTemplateDecimalInput } from "@/features/estimate-templates/lib/template-pricing";
import { TEMPLATE_GENERATION_MODES } from "@/features/estimate-templates/lib/template-generation-mode";

const decimalStringSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,4})?$/);

const optionalDecimalStringSchema = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  decimalStringSchema.nullable().optional(),
);

export const estimateTemplateItemInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(ESTIMATE_TEMPLATE_ITEM_NAME_MAX_LENGTH),
  unit: z.string().trim().min(1).max(24),
  unitPrice: decimalStringSchema,
  vatRate: optionalDecimalStringSchema,
  note: z.string().trim().max(ESTIMATE_TEMPLATE_ITEM_NOTE_MAX_LENGTH).optional().nullable(),
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
  items: z.array(estimateTemplateItemInputSchema).default([]),
});

export const estimateTemplateInputSchema = z.object({
  name: z.string().trim().min(1).max(ESTIMATE_TEMPLATE_NAME_MAX_LENGTH),
  description: z
    .string()
    .trim()
    .max(ESTIMATE_TEMPLATE_DESCRIPTION_MAX_LENGTH)
    .optional()
    .nullable(),
  generationMode: z.enum(TEMPLATE_GENERATION_MODES).default("SMART"),
  currency: z
    .string()
    .trim()
    .length(TEMPLATE_CURRENCY_LENGTH)
    .transform((value) => value.toUpperCase())
    .default("PLN"),
  sections: z.array(estimateTemplateSectionInputSchema).min(1),
});

export type EstimateTemplateInput = z.infer<typeof estimateTemplateInputSchema>;

export function parseTemplateItemDecimals(item: {
  unitPrice: string;
  vatRate?: string | null;
}) {
  return {
    unitPrice: normalizeTemplateDecimalInput(item.unitPrice),
    vatRate: item.vatRate ? normalizeTemplateDecimalInput(item.vatRate) || null : null,
  };
}

export function isValidTemplateItemDecimals(item: {
  unitPrice: string;
  vatRate?: string | null;
}): boolean {
  return (
    isTemplateDecimalValue(item.unitPrice, true) &&
    isTemplateDecimalValue(item.vatRate ?? "", false)
  );
}
