import type { EstimateDraftOutput } from "@/ai/schemas/estimate-draft-output";
import { fuzzySectionMatch, normalizeEvalText, polishTermMatch } from "@evals/engine/lib/text-utils";
import type { Expectations } from "@evals/engine/schemas/scenario";
import type { RuleScoreResult } from "@evals/engine/types";

const PRICED_SECTION_TITLES = new Set([
  "uslugi",
  "services",
  "opcje dodatkowe",
  "add-ons",
  "addons",
]);

function collectItemNames(output: EstimateDraftOutput): string[] {
  return output.sections.flatMap((s) => s.items.map((i) => i.name));
}

function collectMustNotSearchItemNames(output: EstimateDraftOutput): string[] {
  const names: string[] = [];
  for (const section of output.sections) {
    const title = normalizeEvalText(section.title.trim());
    if (!PRICED_SECTION_TITLES.has(title)) {
      continue;
    }
    for (const item of section.items) {
      names.push(item.name);
    }
  }
  return names;
}

function collectMustNotSearchSectionTitles(output: EstimateDraftOutput): string[] {
  return output.sections
    .filter((s) => PRICED_SECTION_TITLES.has(normalizeEvalText(s.title.trim())))
    .map((s) => s.title);
}

export function scoreRules(
  output: EstimateDraftOutput,
  expectations: Expectations,
): RuleScoreResult {
  const checks: RuleScoreResult["checks"] = [];
  const itemNames = collectItemNames(output);
  const sectionTitles = output.sections.map((s) => s.title);
  const mustNotItemNames = collectMustNotSearchItemNames(output);
  const mustNotSectionTitles = collectMustNotSearchSectionTitles(output);
  const allItemText = itemNames.join(" ");
  const allSectionText = sectionTitles.join(" ");

  let mustHaveScore = 0;
  for (const entry of expectations.mustHave) {
    const scope = entry.scope ?? "any_item";
    let found = false;
    if (scope === "any_item") {
      found = itemNames.some((n) => polishTermMatch(n, entry.term));
    } else if (scope === "any_section") {
      found =
        polishTermMatch(allItemText, entry.term) ||
        polishTermMatch(allSectionText, entry.term);
    } else if (scope === "section_title") {
      found = sectionTitles.some((t) => polishTermMatch(t, entry.term));
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
    const inItems = mustNotItemNames.some((n) => polishTermMatch(n, entry.term));
    const inSections = mustNotSectionTitles.some((t) => polishTermMatch(t, entry.term));
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
