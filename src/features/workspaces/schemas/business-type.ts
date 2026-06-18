import { WorkspaceIndustry } from "@prisma/client";
import { z } from "zod";

import { isServiceWorkspace } from "@/features/workspaces/lib/industries";

export const BUSINESS_TYPE_MIN_LENGTH = 3;
export const BUSINESS_TYPE_MAX_LENGTH = 120;

export const businessTypeTextSchema = z
  .string()
  .trim()
  .min(BUSINESS_TYPE_MIN_LENGTH, "Business type must be at least 3 characters.")
  .max(BUSINESS_TYPE_MAX_LENGTH, "Business type must be at most 120 characters.");

export const updateWorkspaceBusinessTypeSchema = z.object({
  industryOtherText: businessTypeTextSchema,
});

export type UpdateWorkspaceBusinessTypeInput = z.infer<
  typeof updateWorkspaceBusinessTypeSchema
>;

export function validateBusinessTypeForIndustry(
  industry: WorkspaceIndustry,
  industryOtherText: string | null | undefined,
): boolean {
  if (!isServiceWorkspace(industry)) {
    return true;
  }
  return businessTypeTextSchema.safeParse(industryOtherText ?? "").success;
}
