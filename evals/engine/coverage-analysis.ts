import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { loadServicesScenarios } from "@evals/engine/load-scenarios";
import { polishTermMatch } from "@evals/engine/lib/text-utils";
import type { EvalScenario } from "@evals/engine/schemas/scenario";
import type { RunSummary } from "@evals/engine/types";

function termInBrief(brief: string, term: string): boolean {
  return polishTermMatch(brief, term);
}

function classifyRootCause(input: {
  schemaPassed: boolean;
  missedTerms: string[];
  brief: string;
  itemNames: string[];
  coveragePercent: number;
}): { primary: string; rationale: string; action: string } {
  if (!input.schemaPassed) {
    return {
      primary: "Schema issue",
      rationale: "Schema scorer failed — rules/coverage/judge may be skipped or unreliable.",
      action: "Fix structured output (empty sections, invalid quantities) before tuning coverage.",
    };
  }

  const unrealisticTerms = input.missedTerms.filter((t) => !termInBrief(input.brief, t));
  if (unrealisticTerms.length > 0) {
    return {
      primary: "Fixture expectation unrealistic",
      rationale: `Missed coverage terms not found in brief: ${unrealisticTerms.join(", ")}.`,
      action: `Adjust fixture coverageTerms — remove or narrow: ${unrealisticTerms.join(", ")}.`,
    };
  }

  if (input.missedTerms.length > 0 && input.itemNames.length <= 3) {
    return {
      primary: "Prompt under-generating",
      rationale: `Brief supports missed terms (${input.missedTerms.join(", ")}) but output has only ${input.itemNames.length} line items.`,
      action: "Review Services Output Rules / Completeness — model may be collapsing scope.",
    };
  }

  if (input.missedTerms.length > 0) {
    return {
      primary: "Prompt under-generating",
      rationale: `Terms from brief not reflected in line items: ${input.missedTerms.join(", ")}.`,
      action: "Review prompt blocks or add workspace-specific guidance for this scenario.",
    };
  }

  return {
    primary: "Other",
    rationale: `Coverage ${input.coveragePercent}% with no missed terms flagged.`,
    action: "No change — coverage informational only.",
  };
}

function checkbox(selected: string, label: string): string {
  const mark = selected === label ? "x" : " ";
  return `- [${mark}] ${label}`;
}

export function writeCoverageRootCauseReport(
  repoRoot: string,
  resultsDir: string,
  summary: RunSummary,
  scenarios: EvalScenario[],
): { path: string; analyzed: number } {
  const scenarioById = new Map(scenarios.map((s) => [s.id, s]));

  const sections: string[] = [
    "# Coverage Root Cause Analysis",
    "",
    `Run: \`${summary.runId}\` | Prompt: v${summary.promptVersion}`,
    "",
  ];

  const lowCoverage = Object.values(summary.scenarios).filter(
    (s) => s.coverageTotal > 0 && (s.coveragePercent < 75 || s.coverageMatched < s.coverageTotal),
  );

  if (lowCoverage.length === 0) {
    sections.push("_No scenarios below 75% coverage or with missed terms._\n");
  }

  for (const result of lowCoverage) {
    const fixture = scenarioById.get(result.id);
    const brief = fixture?.request.project.description ?? "";
    const coverageTerms = fixture?.expectations.coverageTerms ?? [];

    let matchedTerms: string[] = [];
    let missedTerms: string[] = [];
    const coveragePath = join(resultsDir, result.id, "coverage-score.json");
    if (existsSync(coveragePath)) {
      const coverage = JSON.parse(readFileSync(coveragePath, "utf8")) as {
        matchedTerms: string[];
        missedTerms: string[];
      };
      matchedTerms = coverage.matchedTerms;
      missedTerms = coverage.missedTerms;
    } else {
      missedTerms = coverageTerms.filter(() => result.coverageMatched < result.coverageTotal);
    }

    const itemNames: string[] = [];
    const genPath = join(resultsDir, result.id, "generated-estimate.json");
    if (existsSync(genPath)) {
      const gen = JSON.parse(readFileSync(genPath, "utf8")) as {
        sections: Array<{ items: Array<{ name: string }> }>;
      };
      for (const sec of gen.sections ?? []) {
        for (const item of sec.items ?? []) {
          itemNames.push(item.name);
        }
      }
    }

    const classification = classifyRootCause({
      schemaPassed: result.schemaPassed,
      missedTerms,
      brief,
      itemNames,
      coveragePercent: result.coveragePercent,
    });

    const briefExcerpt = brief.length > 200 ? `${brief.slice(0, 200)}…` : brief;

    sections.push(
      `## ${result.id}`,
      "",
      "### Evidence",
      `- Brief excerpt: ${briefExcerpt}`,
      `- coverageTerms: ${JSON.stringify(coverageTerms)}`,
      `- matched: ${JSON.stringify(matchedTerms)} | missed: ${JSON.stringify(missedTerms)}`,
      `- Generated item names: ${JSON.stringify(itemNames)}`,
      "",
      "### Coverage root cause (pick one primary)",
      checkbox(classification.primary, "Prompt under-generating"),
      checkbox(classification.primary, "Fixture expectation unrealistic"),
      checkbox(classification.primary, "Judge mismatch"),
      checkbox(classification.primary, "Schema issue"),
      checkbox(classification.primary, "Other"),
      "",
      "### Recommended action",
      `- [x] ${classification.action}`,
      "",
      "### Rationale",
      classification.rationale,
      "",
    );
  }

  const outPath = join(resultsDir, "coverage-root-cause.md");
  writeFileSync(outPath, sections.join("\n"), "utf8");
  return { path: outPath, analyzed: lowCoverage.length };
}

export function writeCoverageRootCauseForRun(
  repoRoot: string,
  runId: string,
): { path: string; analyzed: number } | null {
  const resultsDir = join(repoRoot, "evals", "results", runId);
  const summaryPath = join(resultsDir, "summary.json");
  if (!existsSync(summaryPath)) {
    return null;
  }

  const summary = JSON.parse(readFileSync(summaryPath, "utf8")) as RunSummary;
  const scenarios = loadServicesScenarios(repoRoot);
  return writeCoverageRootCauseReport(repoRoot, resultsDir, summary, scenarios);
}
