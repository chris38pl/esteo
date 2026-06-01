import { z } from "zod";

import { ESTIMATE_SYSTEM_RULE_IDS } from "@/features/workspaces/lib/estimate-system-rules";
import { workspaceEstimateSectionsSchema } from "@/features/workspaces/schemas/estimate-sections";

const estimateSystemRuleStateSchema = z.record(
  z.enum(ESTIMATE_SYSTEM_RULE_IDS),
  z.boolean(),
);

export const workspaceBrandingSchema = z.object({
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().min(1).optional(),
  accentColor: z.string().min(1).optional(),
  estimateSystemRules: estimateSystemRuleStateSchema.optional(),
  estimateSections: workspaceEstimateSectionsSchema.optional(),
});

export type WorkspaceBranding = z.infer<typeof workspaceBrandingSchema>;
