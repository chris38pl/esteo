import type { EstimateDraftOutput } from "@/ai/schemas/estimate-draft-output";
import { textContainsTerm } from "@evals/engine/lib/text-utils";
import type { CoverageScoreResult } from "@evals/engine/types";

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

  const itemNames = output.sections.flatMap((s) => s.items.map((i) => i.name));
  const sectionTitles = output.sections.map((s) => s.title);
  const corpus = [...itemNames, ...sectionTitles].join(" ");

  const matchedTerms: string[] = [];
  const missedTerms: string[] = [];

  for (const term of coverageTerms) {
    if (itemNames.some((n) => textContainsTerm(n, term)) || textContainsTerm(corpus, term)) {
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
