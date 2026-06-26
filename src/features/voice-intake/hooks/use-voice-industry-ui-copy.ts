import type { WorkspaceIndustry } from "@prisma/client";
import { useTranslations } from "next-intl";

import { useVoiceIndustryTranslations } from "@/features/voice-intake/hooks/use-voice-industry-translations";
import { isServiceWorkspace } from "@/features/workspaces/lib/industries";

export function useVoiceIndustryUiCopy(industry: WorkspaceIndustry) {
  const tTrigger = useTranslations("voiceIntake.trigger");
  const tRecording = useTranslations("voiceIntake.recording");
  const tPortal = useTranslations("voiceIntake.portal");
  const tIndustry = useVoiceIndustryTranslations(industry);

  if (!isServiceWorkspace(industry)) {
    return {
      triggerLabel: tTrigger("label"),
      triggerHint: tTrigger("hint"),
      initialTitleLine1: tRecording("initialTitleLine1"),
      initialTitleHighlight: tRecording("initialTitleHighlight"),
      initialSubtitle: tRecording("initialSubtitle"),
      maxDuration: tRecording("maxDuration"),
      portalAriaLabel: tPortal("ariaLabel"),
    };
  }

  return {
    triggerLabel: tIndustry("trigger.label"),
    triggerHint: tIndustry("trigger.hint"),
    initialTitleLine1: tIndustry("recording.initialTitleLine1"),
    initialTitleHighlight: tIndustry("recording.initialTitleHighlight"),
    initialSubtitle: tIndustry("recording.initialSubtitle"),
    maxDuration: tIndustry("recording.maxDuration"),
    portalAriaLabel: tIndustry("portal.ariaLabel"),
  };
}
