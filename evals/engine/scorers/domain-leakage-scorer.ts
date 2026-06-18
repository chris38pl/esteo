import type { EstimateDraftOutput } from "@/ai/schemas/estimate-draft-output";
import type { LeakageDomain } from "@evals/engine/config/domain-leakage-terms";
import { DOMAIN_LEAKAGE_TERMS } from "@evals/engine/config/domain-leakage-terms";
import { normalizeEvalText } from "@evals/engine/lib/text-utils";
import type { LeakageScoreResult } from "@evals/engine/types";

export function scoreDomainLeakage(
  output: EstimateDraftOutput,
  domain: LeakageDomain,
  maxTerms: number,
): LeakageScoreResult {
  const terms = DOMAIN_LEAKAGE_TERMS[domain];
  const haystacks = output.sections.flatMap((s) => [
    s.title,
    ...s.items.map((i) => i.name),
  ]);
  const normalizedHay = haystacks.map((h) => normalizeEvalText(h));

  const detectedTerms: string[] = [];
  for (const term of terms) {
    const normalizedTerm = normalizeEvalText(term);
    if (normalizedHay.some((h) => h.includes(normalizedTerm))) {
      if (!detectedTerms.includes(term)) {
        detectedTerms.push(term);
      }
    }
  }

  const detectedCount = detectedTerms.length;
  const score = Math.max(0, 10 - Math.min(10, detectedCount * 2));

  return {
    score,
    detectedTerms,
    passed: detectedCount <= maxTerms,
    domain,
  };
}
