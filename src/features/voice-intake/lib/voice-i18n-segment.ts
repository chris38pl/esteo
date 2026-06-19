import { WorkspaceIndustry } from "@prisma/client";

import { getIndustryExperienceSegment } from "@/features/estimate-requests/config/industry-experience-config";

export type VoiceI18nSegment = "construction" | "services" | "carpentry" | "electrical";

export function getVoiceI18nSegment(industry: WorkspaceIndustry): VoiceI18nSegment {
  if (industry === WorkspaceIndustry.CARPENTRY) {
    return "carpentry";
  }
  if (industry === WorkspaceIndustry.ELECTRICAL) {
    return "electrical";
  }
  return getIndustryExperienceSegment(industry);
}
