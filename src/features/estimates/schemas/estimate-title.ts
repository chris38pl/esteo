import { z } from "zod";

import { isLocale, type Locale } from "@/lib/locale";
import { prismaEntityIdSchema } from "@/lib/schemas/prisma-id";

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export const ESTIMATE_TITLE_MAX_LENGTH = 200;

const estimateTitleValueSchema = z
  .string()
  .transform(cleanText)
  .refine(
    (value) => value.length <= ESTIMATE_TITLE_MAX_LENGTH,
    `Must be at most ${ESTIMATE_TITLE_MAX_LENGTH} characters.`,
  )
  .refine((value) => !CONTROL_CHARACTERS.test(value), "Invalid characters.")
  .transform((value) => (value.length === 0 ? null : value));

export const updateEstimateTitleSchema = z.object({
  estimateId: prismaEntityIdSchema,
  workspaceId: prismaEntityIdSchema,
  workspaceSlug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  title: estimateTitleValueSchema,
  locale: z
    .string()
    .optional()
    .transform((value): Locale | undefined => (value && isLocale(value) ? value : undefined)),
});

export type UpdateEstimateTitleInput = z.infer<typeof updateEstimateTitleSchema>;
