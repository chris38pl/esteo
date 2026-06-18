import { z } from "zod";

/** Max chars the user can save in workspace settings. */
export const COMPANY_DESCRIPTION_MAX_LENGTH = 1500;

/** Max chars injected into AI prompts (safety cap on top of storage limit). */
export const COMPANY_DESCRIPTION_PROMPT_MAX_LENGTH = 1200;

/** Company description length that counts as rich domain context for AI Readiness. */
export const COMPANY_DESCRIPTION_RICH_CONTEXT_MIN_LENGTH = 300;

export const companyDescriptionSchema = z
  .string()
  .trim()
  .max(COMPANY_DESCRIPTION_MAX_LENGTH)
  .optional()
  .nullable()
  .transform((value) => (value && value.length > 0 ? value : null));

export function parseCompanyDescription(
  value: string | null | undefined,
): string | null {
  return companyDescriptionSchema.parse(value ?? null);
}
