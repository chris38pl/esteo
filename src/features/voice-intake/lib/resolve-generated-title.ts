import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";
import { buildTitleFromExtraction } from "@/features/voice-intake/lib/build-title-from-extraction";
import type { Locale } from "@/lib/locale";

export function resolveGeneratedTitle(
  currentTitle: string,
  extraction: VoiceIntakeExtraction,
  locale: Locale,
  displayTitle?: string | null,
): string {
  if (currentTitle.trim().length > 0) {
    return currentTitle.trim();
  }

  const programmatic = displayTitle?.trim() || buildTitleFromExtraction(extraction, locale);
  if (programmatic.length > 0 && programmatic.length <= 60) {
    return programmatic;
  }
  if (programmatic.length > 60) {
    return programmatic.slice(0, 60).trimEnd();
  }

  return "";
}
