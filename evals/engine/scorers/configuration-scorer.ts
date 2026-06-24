import type { EstimateDraftOutput } from "@/ai/schemas/estimate-draft-output";
import { polishTermMatch } from "@evals/engine/lib/text-utils";
import type { Expectations } from "@evals/engine/schemas/scenario";
import type { RuleScoreResult } from "@evals/engine/types";

function normalizeUnit(unit: string | null | undefined): string {
  return (unit ?? "")
    .trim()
    .toLowerCase()
    .replace(/㎡/g, "m²")
    .replace(/m2/g, "m²")
    .replace(/\s+/g, "");
}

function unitsEquivalent(a: string | null | undefined, b: string | null | undefined): boolean {
  return normalizeUnit(a) === normalizeUnit(b);
}

function decimalClose(a: unknown, b: string): boolean {
  const left = typeof a === "number" ? a : Number(String(a).replace(",", "."));
  const right = Number(b.replace(",", "."));
  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    return false;
  }
  return Math.abs(left - right) <= 0.01;
}

function collectItems(output: EstimateDraftOutput) {
  return output.sections.flatMap((section) =>
    section.items.map((item) => ({
      sectionTitle: section.title,
      name: item.name,
      unit: item.unit ?? null,
      unitPrice: item.unitPrice,
    })),
  );
}

export function scoreConfiguration(
  output: EstimateDraftOutput,
  expectations: Expectations,
): RuleScoreResult {
  const config = expectations.configuration;
  if (!config) {
    return { score: 10, passed: true, checks: [] };
  }

  const checks: RuleScoreResult["checks"] = [];
  const items = collectItems(output);

  for (const expected of config.expectedTemplateItems) {
    const found = items.some((item) => polishTermMatch(item.name, expected.term));
    checks.push({
      id: `templateItem:${expected.term}`,
      passed: found,
      detail: found ? "found" : "missing",
    });
  }

  for (const expected of config.expectedPrices) {
    const found = items.some(
      (item) =>
        polishTermMatch(item.name, expected.term) &&
        unitsEquivalent(item.unit, expected.unit) &&
        decimalClose(item.unitPrice, expected.unitPrice),
    );
    checks.push({
      id: `expectedPrice:${expected.term}`,
      passed: found,
      detail: found
        ? `matched ${expected.unitPrice}/${expected.unit}`
        : `missing ${expected.unitPrice}/${expected.unit}`,
    });
  }

  for (const forbidden of config.mustNotUsePrices) {
    const violation = items.some(
      (item) =>
        polishTermMatch(item.name, forbidden.term) &&
        !unitsEquivalent(item.unit, forbidden.sourceUnit) &&
        decimalClose(item.unitPrice, forbidden.unitPrice),
    );
    checks.push({
      id: `mustNotUsePrice:${forbidden.term}`,
      passed: !violation,
      detail: violation ? "forbidden price used with incompatible unit" : "not used",
    });
  }

  if (checks.length === 0) {
    return { score: 10, passed: true, checks };
  }

  const passedCount = checks.filter((check) => check.passed).length;
  const score = Math.round((passedCount / checks.length) * 100) / 10;

  return {
    score,
    passed: checks.every((check) => check.passed),
    checks,
  };
}
