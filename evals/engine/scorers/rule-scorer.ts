import type { EstimateDraftOutput } from "@/ai/schemas/estimate-draft-output";
import { fuzzySectionMatch, textContainsTerm } from "@evals/engine/lib/text-utils";
import type { Expectations } from "@evals/engine/schemas/scenario";
import type { RuleScoreResult } from "@evals/engine/types";

function collectItemNames(output: EstimateDraftOutput): string[] {
  return output.sections.flatMap((s) => s.items.map((i) => i.name));
}

function collectSectionTitles(output: EstimateDraftOutput): string[] {
  return output.sections.map((s) => s.title);
}

export function scoreRules(
  output: EstimateDraftOutput,
  expectations: Expectations,
): RuleScoreResult {
  const checks: RuleScoreResult["checks"] = [];
  const itemNames = collectItemNames(output);
  const sectionTitles = collectSectionTitles(output);
  const allItemText = itemNames.join(" ");
  const allSectionText = sectionTitles.join(" ");

  let mustHaveScore = 0;
  for (const entry of expectations.mustHave) {
    const scope = entry.scope ?? "any_item";
    let found = false;
    if (scope === "any_item") {
      found = itemNames.some((n) => textContainsTerm(n, entry.term));
    } else if (scope === "any_section") {
      found =
        textContainsTerm(allItemText, entry.term) ||
        textContainsTerm(allSectionText, entry.term);
    } else if (scope === "section_title") {
      found = sectionTitles.some((t) => textContainsTerm(t, entry.term));
    }
    mustHaveScore += found ? 1 : 0;
    checks.push({
      id: `mustHave:${entry.term}`,
      passed: found,
      detail: found ? "found" : "missing",
    });
  }
  const mustHaveRatio =
    expectations.mustHave.length > 0 ? mustHaveScore / expectations.mustHave.length : 1;

  let mustNotPass = true;
  for (const entry of expectations.mustNotHave) {
    const inItems = itemNames.some((n) => textContainsTerm(n, entry.term));
    const inSections = sectionTitles.some((t) => textContainsTerm(t, entry.term));
    const ok = !inItems && !inSections;
    mustNotPass &&= ok;
    checks.push({
      id: `mustNotHave:${entry.term}`,
      passed: ok,
      detail: ok ? "absent" : "found",
    });
  }
  const mustNotRatio = mustNotPass ? 1 : 0;

  let requiredSectionsScore = 0;
  for (const required of expectations.requiredSections) {
    const found = sectionTitles.some((t) => fuzzySectionMatch(t, required));
    requiredSectionsScore += found ? 1 : 0;
    checks.push({
      id: `requiredSection:${required}`,
      passed: found,
      detail: found ? "found" : "missing",
    });
  }
  const requiredSectionsRatio =
    expectations.requiredSections.length > 0
      ? requiredSectionsScore / expectations.requiredSections.length
      : 1;

  let forbiddenSectionsPass = true;
  for (const forbidden of expectations.forbiddenSections) {
    const found = sectionTitles.some((t) => fuzzySectionMatch(t, forbidden));
    const ok = !found;
    forbiddenSectionsPass &&= ok;
    checks.push({
      id: `forbiddenSection:${forbidden}`,
      passed: ok,
      detail: ok ? "absent" : "found",
    });
  }
  const forbiddenSectionsRatio = forbiddenSectionsPass ? 1 : 0;

  const lineItemCount = itemNames.length;
  const countOk =
    lineItemCount >= expectations.minLineItems &&
    lineItemCount <= expectations.maxLineItems;
  checks.push({
    id: "lineItemCount",
    passed: countOk,
    detail: `${lineItemCount} (expected ${expectations.minLineItems}-${expectations.maxLineItems})`,
  });
  const countRatio = countOk ? 1 : 0;

  const score =
    (mustHaveRatio * 3.5 +
      mustNotRatio * 2.5 +
      requiredSectionsRatio * 2.0 +
      forbiddenSectionsRatio * 1.0 +
      countRatio * 1.0) *
    1;

  const hardPassed =
    mustNotPass &&
    forbiddenSectionsPass &&
    (expectations.mustHave.length === 0 || mustHaveScore === expectations.mustHave.length) &&
    (expectations.requiredSections.length === 0 ||
      requiredSectionsScore === expectations.requiredSections.length);

  return {
    score: Math.round(score * 10) / 10,
    passed: hardPassed && score >= 6,
    checks,
  };
}
