import { WorkspaceIndustry } from "@prisma/client";

export type EstimateRequestHeroAssets = {
  light: string;
  dark: string;
};

const INDUSTRY_SLUG: Record<WorkspaceIndustry, string> = {
  [WorkspaceIndustry.CONSTRUCTION]: "construction",
  [WorkspaceIndustry.CARPENTRY]: "carpentry",
  [WorkspaceIndustry.ELECTRICAL]: "electrical",
  [WorkspaceIndustry.PLUMBING]: "plumbing",
  [WorkspaceIndustry.OTHER]: "services",
};

export function getEstimateRequestHeroAssets(
  industry: WorkspaceIndustry,
): EstimateRequestHeroAssets {
  const slug = INDUSTRY_SLUG[industry];
  return {
    light: `/images/estimate-request/${slug}/hero-light.webp`,
    dark: `/images/estimate-request/${slug}/hero-dark.webp`,
  };
}

/** Safe fallback when industry assets are not ready yet (e.g. PLUMBING). */
export function resolveEstimateRequestHeroAssets(
  industry: WorkspaceIndustry,
): EstimateRequestHeroAssets {
  if (industry === WorkspaceIndustry.PLUMBING) {
    return getEstimateRequestHeroAssets(WorkspaceIndustry.CONSTRUCTION);
  }
  return getEstimateRequestHeroAssets(industry);
}
