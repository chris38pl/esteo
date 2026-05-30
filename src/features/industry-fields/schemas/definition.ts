import {
  BusinessDocumentType,
  IndustryFieldValueType,
  WorkspaceIndustry,
  WorkspaceLocale,
} from "@prisma/client";
import { z } from "zod";

export const selectOptionSchema = z.object({
  value: z.string().trim().min(1).max(64),
  labelKey: z.string().trim().max(64).optional(),
});

export const fieldTranslationInputSchema = z.object({
  locale: z.nativeEnum(WorkspaceLocale),
  label: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  placeholder: z.string().trim().max(200).optional().nullable(),
});

export const createFieldDefinitionSchema = z.object({
  industry: z.nativeEnum(WorkspaceIndustry),
  documentType: z.nativeEnum(BusinessDocumentType),
  key: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/, "Key must be a lowercase slug (e.g. property_type)."),
  valueType: z.nativeEnum(IndustryFieldValueType),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  required: z.boolean().default(false),
  active: z.boolean().default(true),
  options: z.array(selectOptionSchema).optional().nullable(),
  translations: z.array(fieldTranslationInputSchema).min(1),
});

export const updateFieldDefinitionSchema = z.object({
  id: z.string().min(1),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  required: z.boolean().optional(),
  active: z.boolean().optional(),
  options: z.array(selectOptionSchema).optional().nullable(),
  translations: z.array(fieldTranslationInputSchema).optional(),
});

export const listFieldDefinitionsFilterSchema = z.object({
  industry: z.nativeEnum(WorkspaceIndustry),
  documentType: z.nativeEnum(BusinessDocumentType),
});

export type CreateFieldDefinitionInput = z.infer<typeof createFieldDefinitionSchema>;
export type UpdateFieldDefinitionInput = z.infer<typeof updateFieldDefinitionSchema>;
export type FieldTranslationInput = z.infer<typeof fieldTranslationInputSchema>;
export type SelectOption = z.infer<typeof selectOptionSchema>;
