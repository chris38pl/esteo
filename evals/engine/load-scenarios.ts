import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { evalScenarioSchema, type EvalScenario } from "@evals/engine/schemas/scenario";

export function getServicesFixturesDir(repoRoot: string): string {
  return join(repoRoot, "evals", "services");
}

function collectJsonFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsonFiles(full));
    } else if (entry.name.endsWith(".json")) {
      files.push(full);
    }
  }
  return files;
}

export function loadServicesScenarios(repoRoot: string): EvalScenario[] {
  const dir = getServicesFixturesDir(repoRoot);
  const files = collectJsonFiles(dir);
  const scenarios: EvalScenario[] = [];

  for (const file of files) {
    const raw = JSON.parse(readFileSync(file, "utf8"));
    const parsed = evalScenarioSchema.parse(raw);
    scenarios.push(parsed);
  }

  return scenarios.sort((a, b) => a.id.localeCompare(b.id));
}

export function filterScenarios(
  scenarios: EvalScenario[],
  options: {
    mode?: "quick" | "all";
    quickIds?: string[];
    id?: string;
    category?: string;
    locale?: "pl" | "en" | "all";
  },
): EvalScenario[] {
  let result = scenarios;

  if (options.id) {
    return result.filter((s) => s.id === options.id);
  }

  if (options.mode === "quick" && options.quickIds?.length) {
    const set = new Set(options.quickIds);
    result = result.filter((s) => set.has(s.id));
  }

  if (options.category) {
    result = result.filter((s) => s.category === options.category);
  }

  if (options.locale && options.locale !== "all") {
    result = result.filter((s) => s.locale === options.locale);
  }

  return result;
}
