import { z } from "zod/v3";

import {
  nullableInt,
  nullableMarginPercent,
  nullableNumber,
  nullableString,
} from "@/ai/schemas/structured-output";

const additionLineItemSchema = z.object({
  name: z.string(),
  unit: nullableString(),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  vatRate: z.number().min(0).max(1),
});

const additionSchema = z.object({
  sectionTitle: z.string(),
  items: z.array(additionLineItemSchema),
});

const updateSchema = z.object({
  itemId: z.string(),
  /** Null means this field is unchanged. */
  name: nullableString(),
  unit: nullableString(),
  quantity: nullableNumber(),
  unitPrice: nullableNumber(),
  vatRate: nullableNumber(),
});

const newSectionSchema = z.object({
  title: z.string(),
  /** Null to append at the end. */
  sortOrder: nullableInt(),
});

export const estimateAgentPatchSchema = z.object({
  additions: z.array(additionSchema),
  updates: z.array(updateSchema),
  deletions: z.array(z.string()),
  newSections: z.array(newSectionSchema),
  /** Null when margin should not change. */
  marginPercent: nullableMarginPercent(),
  /** Null when no explanation is needed. */
  reasoning: nullableString(),
});

export type EstimateAgentPatch = z.infer<typeof estimateAgentPatchSchema>;
