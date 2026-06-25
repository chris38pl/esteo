import type { WorkspaceIndustry } from "@prisma/client";

import { hasIndustrySectionDefaults } from "@/features/workspaces/config/industry-estimate-sections";
import type { WorkspaceEstimateSection } from "@/features/workspaces/schemas/estimate-sections";

export type SectionStructureMode =
  | "industry_defaults"
  | "workspace_override"
  | "ai_dynamic";

export function resolveSectionStructureMode(
  industry: WorkspaceIndustry,
  persisted: WorkspaceEstimateSection[] | null | undefined,
): SectionStructureMode {
  if (persisted != null) {
    if (persisted.length === 0 && !hasIndustrySectionDefaults(industry)) {
      return "ai_dynamic";
    }
    return "workspace_override";
  }
  if (!hasIndustrySectionDefaults(industry)) {
    return "ai_dynamic";
  }
  return "industry_defaults";
}
