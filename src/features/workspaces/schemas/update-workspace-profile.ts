import { z } from "zod";

import { companyDescriptionSchema } from "@/features/workspaces/schemas/company-description";

export const updateWorkspaceProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(120, "Name must be at most 120 characters."),
  companyDescription: companyDescriptionSchema,
});

export type UpdateWorkspaceProfileInput = z.infer<typeof updateWorkspaceProfileSchema>;
