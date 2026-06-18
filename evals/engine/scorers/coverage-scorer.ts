import type { EstimateDraftOutput } from "@/ai/schemas/estimate-draft-output";
import { polishTermMatch } from "@evals/engine/lib/text-utils";
import type { CoverageScoreResult } from "@evals/engine/types";

/**
 * Full estimate text for coverage: section titles + all line item names
 * (priced services, scope summaries, exclusions in Zakres/Uwagi).
 */
export function buildEstimateCoverageCorpus(output: EstimateDraftOutput): string {
  const parts: string[] = [];

  for (const section of output.sections) {
    parts.push(section.title);
    for (const item of section.items) {
      parts.push(item.name);
    }
  }

  return parts.join(" ");
}

export function scoreCoverage(
  output: EstimateDraftOutput,
  coverageTerms: string[],
): CoverageScoreResult {
  if (coverageTerms.length === 0) {
    return {
      matched: 0,
      total: 0,
      percent: 100,
      matchedTerms: [],
      missedTerms: [],
    };
  }

  const corpus = buildEstimateCoverageCorpus(output);

  const matchedTerms: string[] = [];
  const missedTerms: string[] = [];

  for (const term of coverageTerms) {
    if (polishTermMatch(corpus, term)) {
      matchedTerms.push(term);
    } else {
      missedTerms.push(term);
    }
  }

  const matched = matchedTerms.length;
  const total = coverageTerms.length;
  const percent = total > 0 ? Math.round((matched / total) * 1000) / 10 : 100;

  return { matched, total, percent, matchedTerms, missedTerms };
}
