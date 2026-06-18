import type { WorkspaceIndustry } from "@prisma/client";
import { useTranslations } from "next-intl";

import { getVoiceI18nSegment } from "@/features/voice-intake/lib/voice-i18n-segment";

export function useVoiceIndustryTranslations(industry: WorkspaceIndustry) {
  const segment = getVoiceI18nSegment(industry);
  const t = useTranslations(`voiceIntake.byIndustry.${segment}`);
  return t;
}
