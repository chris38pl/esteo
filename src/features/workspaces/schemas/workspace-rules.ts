import { z } from "zod";

import {
  WORKSPACE_ESTIMATE_RULES_MAX_COUNT,
  WORKSPACE_GENERAL_RULES_MAX_LENGTH,
  WORKSPACE_RULE_MAX_LENGTH,
} from "@/features/workspaces/lib/workspace-rules-limits";

export const workspaceGeneralRulesSchema = z
  .string()
  .max(WORKSPACE_GENERAL_RULES_MAX_LENGTH)
  .nullable()
  .optional();

export const workspaceRuleContentSchema = z
  .string()
  .trim()
  .min(1)
  .max(WORKSPACE_RULE_MAX_LENGTH, { message: "RULE_CHAR_LIMIT" });

export const createWorkspaceEstimateRuleSchema = z.object({
  content: workspaceRuleContentSchema,
});

export const updateWorkspaceEstimateRuleSchema = z.object({
  content: workspaceRuleContentSchema.optional(),
  active: z.boolean().optional(),
});

export { WORKSPACE_ESTIMATE_RULES_MAX_COUNT };
