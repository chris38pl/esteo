"use client";

import type { WorkspaceIndustry, WorkspaceRule } from "@prisma/client";
import { useMemo } from "react";

import {
  computeAiReadinessScore,
  hasEstimateWorkspaceRule,
  hasRichDomainContext,
  type AiReadinessCriterionKey,
} from "@/features/workspaces/lib/ai-readiness";
import { parseEstimateSectionsFromBranding } from "@/features/workspaces/lib/resolve-estimate-sections";
import type { WorkspaceBranding } from "@/features/workspaces/schemas/branding";

export type WorkspaceAiReadinessInput = {
  workspaceIndustry: WorkspaceIndustry;
  industryOtherText: string;
  companyDescription: string;
  initialBranding: WorkspaceBranding | null;
  rules: WorkspaceRule[];
};

export function useWorkspaceAiReadiness(input: WorkspaceAiReadinessInput) {
  return useMemo(() => {
    const estimateSections = parseEstimateSectionsFromBranding(input.initialBranding ?? undefined);
    const readiness = computeAiReadinessScore({
      industry: input.workspaceIndustry,
      industryOtherText: input.industryOtherText,
      companyDescription: input.companyDescription,
      estimateSections,
      rules: input.rules,
    });

    const hasRules = hasEstimateWorkspaceRule(input.rules);
    const hasRichDescription = hasRichDomainContext(input.companyDescription);

    return {
      readiness,
      hasRules,
      hasRichDescription,
    };
  }, [
    input.companyDescription,
    input.industryOtherText,
    input.initialBranding,
    input.rules,
    input.workspaceIndustry,
  ]);
}

export type { AiReadinessCriterionKey };
