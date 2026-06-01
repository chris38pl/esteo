import { z } from "zod";

import {
  WORKSPACE_ESTIMATE_SECTIONS_MAX_COUNT,
  WORKSPACE_SECTION_RULE_MAX_LENGTH,
  WORKSPACE_SECTION_TITLE_MAX_LENGTH,
} from "@/features/workspaces/lib/workspace-section-limits";

export const workspaceEstimateSectionSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/),
  titlePl: z.string().min(1).max(WORKSPACE_SECTION_TITLE_MAX_LENGTH),
  titleEn: z.string().min(1).max(WORKSPACE_SECTION_TITLE_MAX_LENGTH),
  rulePl: z.string().max(WORKSPACE_SECTION_RULE_MAX_LENGTH).optional(),
  ruleEn: z.string().max(WORKSPACE_SECTION_RULE_MAX_LENGTH).optional(),
  active: z.boolean(),
});

export const workspaceEstimateSectionsSchema = z
  .array(workspaceEstimateSectionSchema)
  .min(1)
  .max(WORKSPACE_ESTIMATE_SECTIONS_MAX_COUNT);

export type WorkspaceEstimateSection = z.infer<typeof workspaceEstimateSectionSchema>;
