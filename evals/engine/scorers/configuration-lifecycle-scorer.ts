import type { Expectations } from "@evals/engine/schemas/scenario";
import type { RuleScoreResult } from "@evals/engine/types";

function promptContains(prompt: string, needle: string): boolean {
  return prompt.toLowerCase().includes(needle.toLowerCase());
}

function hasTemplateBlock(prompt: string): boolean {
  return (
    prompt.includes("## Estimate Template") ||
    prompt.includes("## Szablon kosztorysu") ||
    prompt.includes("Estimate Template")
  );
}

function hasPriceListBlock(prompt: string): boolean {
  return (
    prompt.includes("## Price List") ||
    prompt.includes("## Cennik") ||
    prompt.includes("Price List")
  );
}

export function scoreConfigurationLifecycle(
  prompt: string,
  expectations: Expectations,
): RuleScoreResult {
  const lifecycle = expectations.configurationLifecycle;
  if (!lifecycle) {
    return { score: 10, passed: true, checks: [] };
  }

  const checks: RuleScoreResult["checks"] = [];

  for (const term of lifecycle.promptMustContain ?? []) {
    const found = promptContains(prompt, term);
    checks.push({
      id: `promptMustContain:${term}`,
      passed: found,
      detail: found ? "found in prompt" : "missing from prompt",
    });
  }

  for (const term of lifecycle.promptMustNotContain ?? []) {
    const found = promptContains(prompt, term);
    checks.push({
      id: `promptMustNotContain:${term}`,
      passed: !found,
      detail: found ? "unexpectedly in prompt" : "absent from prompt",
    });
  }

  if (lifecycle.templateInPrompt !== undefined) {
    const hasTemplate = hasTemplateBlock(prompt);
    const ok = hasTemplate === lifecycle.templateInPrompt;
    checks.push({
      id: "templateInPrompt",
      passed: ok,
      detail: `template block ${hasTemplate ? "present" : "absent"}`,
    });
  }

  if (lifecycle.priceListInPrompt !== undefined) {
    const hasPriceList = hasPriceListBlock(prompt);
    const ok = hasPriceList === lifecycle.priceListInPrompt;
    checks.push({
      id: "priceListInPrompt",
      passed: ok,
      detail: `price list block ${hasPriceList ? "present" : "absent"}`,
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
