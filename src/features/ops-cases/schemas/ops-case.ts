import { z } from "zod";

export const updateOpsCaseStatusSchema = z.object({
  number: z.number().int().positive(),
  status: z.enum(["RESOLVED", "IGNORED"]),
  resolutionNotes: z.string().trim().min(1, "Resolution notes are required.").max(10_000),
});

export type UpdateOpsCaseStatusInput = z.infer<typeof updateOpsCaseStatusSchema>;
