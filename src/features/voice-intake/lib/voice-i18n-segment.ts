import type { WorkspaceIndustry } from "@prisma/client";

import { getIndustryExperienceSegment } from "@/features/estimate-requests/config/industry-experience-config";

export type VoiceI18nSegment = "construction" | "services";

export function getVoiceI18nSegment(industry: WorkspaceIndustry): VoiceI18nSegment {
  return getIndustryExperienceSegment(industry);
}
