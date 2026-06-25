import type { EstimateAgentPatch } from "@/ai/schemas/estimate-agent-patch";
import { polishTermMatch } from "@evals/engine/lib/text-utils";
import type { AssistantScenario } from "@evals/engine/schemas/scenario";
import type { RuleScoreResult } from "@evals/engine/types";

function normalizeUnit(unit: string | null | undefined): string {
  return (unit ?? "")
    .trim()
    .toLowerCase()
    .replace(/㎡/g, "m²")
    .replace(/m2/g, "m²")
    .replace(/\s+/g, "");
}

function decimalClose(a: number, b: string): boolean {
  const right = Number(b.replace(",", "."));
  if (!Number.isFinite(right)) {
    return false;
  }
  return Math.abs(a - right) <= 0.01;
}

function fuzzySectionMatch(title: string, expected: string): boolean {
  const normalized = title.trim().toLowerCase();
  const needle = expected.trim().toLowerCase();
  return normalized === needle || normalized.includes(needle) || needle.includes(normalized);
}

export function scoreAssistantPatch(
  patch: EstimateAgentPatch,
  scenario: AssistantScenario,
): RuleScoreResult {
  const checks: RuleScoreResult["checks"] = [];
  const expectations = scenario.expectations;

  for (const expected of expectations.addedItemsMustMatchPrice) {
    const matchingAdditions = patch.additions.flatMap((addition) =>
      addition.items
        .filter((item) => polishTermMatch(item.name, expected.term))
        .map((item) => ({ ...item, sectionTitle: addition.sectionTitle })),
    );

    const found = matchingAdditions.some(
      (item) =>
        decimalClose(item.unitPrice, expected.unitPrice) &&
        normalizeUnit(item.unit) === normalizeUnit(expected.unit),
    );

    checks.push({
      id: `addedPrice:${expected.term}`,
      passed: found,
      detail: found
        ? `matched ${expected.unitPrice}/${expected.unit}`
        : `no addition at ${expected.unitPrice}/${expected.unit}`,
    });
  }

  if (expectations.targetSection) {
    const additions = patch.additions;
    const allInTarget =
      additions.length > 0 &&
      additions.every((addition) =>
        fuzzySectionMatch(addition.sectionTitle, expectations.targetSection!),
      );
    checks.push({
      id: `targetSection:${expectations.targetSection}`,
      passed: allInTarget,
      detail: allInTarget
        ? "additions in target section"
        : `sections: ${additions.map((a) => a.sectionTitle).join(", ") || "none"}`,
    });
  }

  if (checks.length === 0) {
    return { score: 10, passed: true, checks };
  }

  const passedCount = checks.filter((c) => c.passed).length;
  return {
    score: Math.round((passedCount / checks.length) * 100) / 10,
    passed: checks.every((c) => c.passed),
    checks,
  };
}
