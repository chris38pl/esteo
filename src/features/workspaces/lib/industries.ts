import { WorkspaceIndustry } from "@prisma/client";

export const WORKSPACE_INDUSTRIES = [
  WorkspaceIndustry.CONSTRUCTION,
  WorkspaceIndustry.ELECTRICAL,
  WorkspaceIndustry.CARPENTRY,
  WorkspaceIndustry.PLUMBING,
  WorkspaceIndustry.OTHER,
] as const;

/** Industries selectable during workspace signup (post-MVP industries are shown but disabled). */
export const MVP_AVAILABLE_WORKSPACE_INDUSTRIES = [
  WorkspaceIndustry.CONSTRUCTION,
  WorkspaceIndustry.OTHER,
] as const;

export function isWorkspaceIndustryAvailableAtSignup(
  industry: WorkspaceIndustry,
): boolean {
  return (MVP_AVAILABLE_WORKSPACE_INDUSTRIES as readonly WorkspaceIndustry[]).includes(
    industry,
  );
}

export const FIELD_CATALOG_INDUSTRIES = [
  WorkspaceIndustry.CONSTRUCTION,
  WorkspaceIndustry.ELECTRICAL,
  WorkspaceIndustry.CARPENTRY,
  WorkspaceIndustry.PLUMBING,
] as const;

export type WorkspaceIndustryKey = (typeof WORKSPACE_INDUSTRIES)[number];

export function formatWorkspaceIndustry(
  industry: WorkspaceIndustry,
  industryOtherText: string | null | undefined,
): string {
  if (industry === WorkspaceIndustry.OTHER && industryOtherText) {
    return industryOtherText;
  }

  return industry;
}
