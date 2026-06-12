import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";
import { normalizeScopeLabel } from "@/ai/lib/voice-intake-scope-terms";

import { extractTranscriptScopeKeywords } from "@/features/voice-intake/lib/extract-transcript-scope-keywords";

export function buildFollowUpScopeBadges(
  extraction: VoiceIntakeExtraction,
  cleanedTranscript: string,
  max = 10,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  const push = (label: string) => {
    const key = normalizeScopeLabel(label);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(label);
  };

  if (extraction.scopeOfWork.confidence >= 0.5) {
    for (const item of extraction.scopeOfWork.items) {
      if (item.confidence >= 0.5 && item.label.trim()) {
        push(item.label.charAt(0).toUpperCase() + item.label.slice(1));
      }
    }
  }

  for (const keyword of extractTranscriptScopeKeywords(cleanedTranscript)) {
    push(keyword);
  }

  return result.slice(0, max);
}
