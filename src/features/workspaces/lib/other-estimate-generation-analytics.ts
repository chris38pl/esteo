import { slugifyBusinessType } from "@/features/workspaces/lib/slugify-business-type";
import type { SectionStructureMode } from "@/features/workspaces/lib/section-structure-mode";
import type { SectionTitleWarning } from "@/ai/lib/validate-generated-section-titles";

export type OtherEstimateGenerationAnalyticsPayload = {
  workspaceId: string;
  estimateRequestId: string;
  industryOtherText: string | null;
  industryOtherTextSlug: string | null;
  sectionStructureMode: SectionStructureMode;
  generatedSectionTitles: string[];
  generatedSectionCount: number;
  titleValidationWarnings: SectionTitleWarning[];
};

export function trackOtherEstimateGeneration(
  payload: OtherEstimateGenerationAnalyticsPayload,
): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("esteo:other-estimate-generation", {
        detail: payload,
      }),
    );
  }

  console.info("[other-estimate-generation]", payload);
}

export function buildOtherEstimateGenerationAnalyticsPayload(input: {
  workspaceId: string;
  estimateRequestId: string;
  industryOtherText: string | null;
  sectionStructureMode: SectionStructureMode;
  generatedSectionTitles: string[];
  titleValidationWarnings: SectionTitleWarning[];
}): OtherEstimateGenerationAnalyticsPayload {
  const trimmedText = input.industryOtherText?.trim() || null;
  return {
    workspaceId: input.workspaceId,
    estimateRequestId: input.estimateRequestId,
    industryOtherText: trimmedText,
    industryOtherTextSlug: trimmedText ? slugifyBusinessType(trimmedText) : null,
    sectionStructureMode: input.sectionStructureMode,
    generatedSectionTitles: input.generatedSectionTitles,
    generatedSectionCount: input.generatedSectionTitles.length,
    titleValidationWarnings: input.titleValidationWarnings,
  };
}
