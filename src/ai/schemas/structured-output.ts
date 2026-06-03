import { z } from "zod/v3";

/**
 * OpenAI Structured Outputs (strict JSON schema) requires every object property to
 * appear in `required`. Optional/absent values must use null unions, not .optional().
 *
 * @see https://platform.openai.com/docs/guides/structured-outputs
 */

export const nullableString = () => z.union([z.string(), z.null()]);

export const nullableNumber = () => z.union([z.number(), z.null()]);

export const nullableInt = () => z.union([z.number().int(), z.null()]);

export const nullableMarginPercent = () =>
  z.union([z.number().min(0).max(100), z.null()]);
