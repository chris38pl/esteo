import { z } from "zod";

import { prismaEntityIdSchema } from "@/lib/schemas/prisma-id";

export const ESTIMATE_NOTE_BODY_MAX_LENGTH = 2000;

export const estimateNoteBodySchema = z
  .string()
  .trim()
  .min(1, "Note cannot be empty.")
  .max(ESTIMATE_NOTE_BODY_MAX_LENGTH);

export const createEstimateNoteSchema = z.object({
  body: estimateNoteBodySchema,
  parentId: prismaEntityIdSchema.optional(),
});

export type CreateEstimateNoteInput = z.infer<typeof createEstimateNoteSchema>;
