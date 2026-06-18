import { SubscriptionPlan, WorkspaceAppearanceTheme, WorkspaceIndustry } from "@prisma/client";
import { z } from "zod";

import { isWorkspaceIndustryAvailableAtSignup } from "@/features/workspaces/lib/industries";
import { companyDescriptionSchema } from "@/features/workspaces/schemas/company-description";

export const createWorkspaceSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(120, "Name must be at most 120 characters."),
    industry: z.nativeEnum(WorkspaceIndustry),
    industryOtherText: z.string().trim().max(120, "Industry text must be at most 120 characters.").optional(),
    appearanceTheme: z
      .nativeEnum(WorkspaceAppearanceTheme)
      .default(WorkspaceAppearanceTheme.OCEAN_BREEZE),
    plan: z.nativeEnum(SubscriptionPlan).default(SubscriptionPlan.FREE),
    companyDescription: companyDescriptionSchema,
  })
  .refine(
    (data) =>
      data.industry !== WorkspaceIndustry.OTHER ||
      (data.industryOtherText !== undefined && data.industryOtherText.length >= 2),
    {
      message: "Please describe your industry (at least 2 characters).",
      path: ["industryOtherText"],
    },
  )
  .refine((data) => isWorkspaceIndustryAvailableAtSignup(data.industry), {
    message: "This industry is not available yet.",
    path: ["industry"],
  });

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
