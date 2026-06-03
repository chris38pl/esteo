import { z } from "zod/v3";

import {
  nullableMarginPercent,
  nullableString,
} from "@/ai/schemas/structured-output";

export const lineItemSchema = z.object({
  name: z.string(),
  /** Unit of measure; null when not applicable (e.g. lump-sum items). */
  unit: nullableString(),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  vatRate: z.number().min(0).max(1),
  sortOrder: z.number().int(),
});

export const sectionSchema = z.object({
  title: z.string(),
  sortOrder: z.number().int(),
  items: z.array(lineItemSchema),
});

export const estimateDraftOutputSchema = z.object({
  sections: z.array(sectionSchema),
  /** Global margin suggestion (0–100); null when not applicable. */
  suggestedMarginPercent: nullableMarginPercent(),
});

export type EstimateDraftOutput = z.infer<typeof estimateDraftOutputSchema>;
