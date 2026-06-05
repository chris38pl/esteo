import { z } from "zod";

export const ESTIMATE_NOTE_BODY_MAX_LENGTH = 2000;

export const estimateNoteBodySchema = z
  .string()
  .trim()
  .min(1, "Note cannot be empty.")
  .max(ESTIMATE_NOTE_BODY_MAX_LENGTH);

export const createEstimateNoteSchema = z.object({
  body: estimateNoteBodySchema,
  parentId: z.string().cuid().optional(),
});

export type CreateEstimateNoteInput = z.infer<typeof createEstimateNoteSchema>;
