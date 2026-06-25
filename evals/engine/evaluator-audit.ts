import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { EstimateDraftOutput } from "@/ai/schemas/estimate-draft-output";
import {
  getProtectedFixtureTerm,
  isProtectedFixtureTerm,
  listProtectedByReason,
  type ProtectedReason,
} from "@evals/engine/config/protected-fixture-terms";
import { loadServicesScenarios } from "@evals/engine/load-scenarios";
import { normalizeEvalText, polishTermMatch } from "@evals/engine/lib/text-utils";
import { buildEstimateCoverageCorpus } from "@evals/engine/scorers/coverage-scorer";
import type { EvalScenario } from "@evals/engine/schemas/scenario";
import type { RuleScoreResult, RunSummary, ScenarioResult } from "@evals/engine/types";

export type MismatchKind =
  | "exact"
  | "prefix_inflection"
  | "stem_match"
  | "term_too_short"
  | "stem_mismatch"
  | "not_in_corpus";

export type TermMismatchExplanation = {
  matched: boolean;
  kind: MismatchKind;
  closestWord: string | null;
  commonPrefixLength: number;
};

export type EvaluatorIssueClass =
  | "fixture_unrealistic"
  | "matcher_gap"
  | "mustNot_false_positive"
  | "prompt_gap"
  | "judge_threshold"
  | "mixed"
  | "none";

const EXCLUSION_SECTION_TITLES = new Set([
  "zakres",
  "scope",
  "uwagi",
  "notes",
]);

const EXCLUSION_NAME_PATTERN =
  /wyłącz|wyklucz|excluded|nie obejmuje|poza zakresem|not included/i;

function splitWords(text: string): string[] {
  return normalizeEvalText(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 0);
}

function commonPrefixLength(a: string, b: string): number {
  const limit = Math.min(a.length, b.length);
  let i = 0;
  while (i < limit && a[i] === b[i]) {
    i++;
  }
  return i;
}

function termAppearsAsSubstringInCorpus(corpus: string, term: string): boolean {
  const normalizedCorpus = normalizeEvalText(corpus);
  const normalizedTerm = normalizeEvalText(term);
  if (!normalizedTerm) {
    return false;
  }
  if (normalizedCorpus.includes(normalizedTerm)) {
    return true;
  }
  return splitWords(corpus).some(
    (word) =>
      word.includes(normalizedTerm) ||
      normalizedTerm.includes(word) ||
      commonPrefixLength(word, normalizedTerm) >= Math.min(4, normalizedTerm.length),
  );
}

export function explainTermMismatch(corpus: string, term: string): TermMismatchExplanation {
  if (polishTermMatch(corpus, term)) {
    return { matched: true, kind: "exact", closestWord: null, commonPrefixLength: 0 };
  }

  const normalizedTerm = normalizeEvalText(term);
  const words = splitWords(corpus);
  let closestWord: string | null = null;
  let bestPrefix = 0;

  for (const word of words) {
    const prefix = commonPrefixLength(word, normalizedTerm);
    if (prefix > bestPrefix) {
      bestPrefix = prefix;
      closestWord = word;
    }
  }

  if (!termAppearsAsSubstringInCorpus(corpus, term)) {
    return {
      matched: false,
      kind: "not_in_corpus",
      closestWord,
      commonPrefixLength: bestPrefix,
    };
  }

  if (normalizedTerm.length < 4) {
    return {
      matched: false,
      kind: "term_too_short",
      closestWord,
      commonPrefixLength: bestPrefix,
    };
  }

  if (closestWord?.startsWith(normalizedTerm)) {
    return {
      matched: false,
      kind: "prefix_inflection",
      closestWord,
      commonPrefixLength: bestPrefix,
    };
  }

  if (bestPrefix >= Math.min(4, normalizedTerm.length)) {
    return {
      matched: false,
      kind: "stem_mismatch",
      closestWord,
      commonPrefixLength: bestPrefix,
    };
  }

  return {
    matched: false,
    kind: "stem_mismatch",
    closestWord,
    commonPrefixLength: bestPrefix,
  };
}

function termInBrief(brief: string, term: string): boolean {
  return polishTermMatch(brief, term);
}

function loadGeneratedEstimate(resultsDir: string, scenarioId: string): EstimateDraftOutput | null {
  const path = join(resultsDir, scenarioId, "generated-estimate.json");
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, "utf8")) as EstimateDraftOutput;
}

function loadRuleScore(resultsDir: string, scenarioId: string): RuleScoreResult | null {
  const path = join(resultsDir, scenarioId, "rule-score.json");
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, "utf8")) as RuleScoreResult;
}

function findMustNotHitsInExclusions(
  output: EstimateDraftOutput,
  term: string,
): string[] {
  const hits: string[] = [];
  for (const section of output.sections) {
    const sectionTitle = normalizeEvalText(section.title);
    if (!EXCLUSION_SECTION_TITLES.has(sectionTitle)) {
      continue;
    }
    for (const item of section.items) {
      if (item.unitPrice !== 0) {
        continue;
      }
      if (
        polishTermMatch(item.name, term) &&
        (EXCLUSION_NAME_PATTERN.test(item.name) || sectionTitle === "zakres" || sectionTitle === "scope")
      ) {
        hits.push(item.name);
      }
    }
  }
  return hits;
}

function classifyScenarioIssues(input: {
  result: ScenarioResult;
  fixture: EvalScenario | undefined;
  corpus: string;
  output: EstimateDraftOutput | null;
  ruleScore: RuleScoreResult | null;
  missedCoverage: string[];
  failedMustHave: string[];
  failedMustNot: string[];
}): EvaluatorIssueClass {
  const classes = new Set<EvaluatorIssueClass>();
  const brief = input.fixture?.request.project.description ?? "";

  for (const term of input.missedCoverage) {
    if (isProtectedFixtureTerm(input.result.id, term)) {
      continue;
    }
    if (!termInBrief(brief, term)) {
      classes.add("fixture_unrealistic");
    } else if (termAppearsAsSubstringInCorpus(input.corpus, term) && !polishTermMatch(input.corpus, term)) {
      classes.add("matcher_gap");
    } else if (!termAppearsAsSubstringInCorpus(input.corpus, term)) {
      classes.add("prompt_gap");
    }
  }

  for (const term of input.failedMustHave) {
    if (isProtectedFixtureTerm(input.result.id, term)) {
      continue;
    }
    if (!termInBrief(brief, term)) {
      classes.add("fixture_unrealistic");
    } else if (termAppearsAsSubstringInCorpus(input.corpus, term) && !polishTermMatch(input.corpus, term)) {
      classes.add("matcher_gap");
    } else {
      classes.add("prompt_gap");
    }
  }

  for (const term of input.failedMustNot) {
    if (input.output) {
      const exclusionHits = findMustNotHitsInExclusions(input.output, term);
      if (exclusionHits.length > 0) {
        classes.add("mustNot_false_positive");
      }
    }
  }

  const judgeOnly =
    input.result.failReasons.length > 0 &&
    input.result.failReasons.every((r) =>
      ["referenceSimilarity", "contextAlignment", "overallScore"].includes(r),
    );
  if (judgeOnly && !input.result.failReasons.includes("rules")) {
    classes.add("judge_threshold");
  }

  if (classes.size === 0) {
    return input.result.passed ? "none" : "mixed";
  }
  if (classes.size === 1) {
    return [...classes][0]!;
  }
  return "mixed";
}

function formatProtectedTermsSection(): string[] {
  const lines: string[] = ["## Protected terms", ""];
  const reasonLabels: Record<ProtectedReason, string> = {
    matcher_deficiency: "Matcher deficiencies",
    prompt_gap: "Prompt gaps",
    intentional_strict_test: "Intentional strict tests",
  };

  for (const reason of Object.keys(reasonLabels) as ProtectedReason[]) {
    const items = listProtectedByReason(reason);
    lines.push(`### ${reasonLabels[reason]}`);
    if (items.length === 0) {
      lines.push("_(empty)_", "");
      continue;
    }
    for (const item of items) {
      const note = item.note ? ` — ${item.note}` : "";
      lines.push(`- ${item.scenarioId} / ${item.term}${note}`);
    }
    lines.push("");
  }

  return lines;
}

export type MatcherDeficiencyEntry = {
  scenarioId: string;
  term: string;
  source: "coverage" | "mustHave";
  protected: boolean;
  closestWord: string | null;
};

export function collectMatcherDeficiencies(input: {
  scenarios: EvalScenario[];
  resultsDir: string;
  summary: RunSummary;
}): MatcherDeficiencyEntry[] {
  const scenarioById = new Map(input.scenarios.map((s) => [s.id, s]));
  const entries: MatcherDeficiencyEntry[] = [];
  const seen = new Set<string>();

  for (const result of Object.values(input.summary.scenarios)) {
    const fixture = scenarioById.get(result.id);
    const brief = fixture?.request.project.description ?? "";
    const output = loadGeneratedEstimate(input.resultsDir, result.id);
    const corpus = output ? buildEstimateCoverageCorpus(output) : "";
    const ruleScore = loadRuleScore(input.resultsDir, result.id);

    const missedCoverage =
      result.coverageTotal > 0 && result.coverageMatched < result.coverageTotal
        ? (JSON.parse(
            existsSync(join(input.resultsDir, result.id, "coverage-score.json"))
              ? readFileSync(join(input.resultsDir, result.id, "coverage-score.json"), "utf8")
              : '{"missedTerms":[]}',
          ) as { missedTerms: string[] }).missedTerms
        : [];

    const failedMustHave =
      ruleScore?.checks
        .filter((c) => c.id.startsWith("mustHave:") && !c.passed)
        .map((c) => c.id.slice("mustHave:".length)) ?? [];

    const terms: Array<{ term: string; source: "coverage" | "mustHave" }> = [
      ...fixture?.expectations.coverageTerms.map((term) => ({
        term,
        source: "coverage" as const,
      })) ?? [],
      ...fixture?.expectations.mustHave.map((rule) => ({
        term: rule.term,
        source: "mustHave" as const,
      })) ?? [],
    ];

    const seenLocal = new Set<string>();
    for (const { term, source } of terms) {
      const key = `${result.id}:${term}`;
      if (seen.has(key) || seenLocal.has(key)) {
        continue;
      }
      seenLocal.add(key);

      if (!termInBrief(brief, term)) {
        continue;
      }
      if (polishTermMatch(corpus, term)) {
        continue;
      }

      seen.add(key);
      const explain = explainTermMismatch(corpus, term);
      entries.push({
        scenarioId: result.id,
        term,
        source,
        protected: isProtectedFixtureTerm(result.id, term),
        closestWord: explain.closestWord,
      });
    }

    for (const term of [...missedCoverage, ...failedMustHave]) {
      const key = `${result.id}:${term}`;
      if (seen.has(key)) {
        continue;
      }
      if (!termInBrief(brief, term) || polishTermMatch(corpus, term)) {
        continue;
      }
      seen.add(key);
      const explain = explainTermMismatch(corpus, term);
      entries.push({
        scenarioId: result.id,
        term,
        source: missedCoverage.includes(term) ? "coverage" : "mustHave",
        protected: isProtectedFixtureTerm(result.id, term),
        closestWord: explain.closestWord,
      });
    }
  }

  return entries;
}

export function writeMatcherDeficiencyReport(
  resultsDir: string,
  summary: RunSummary,
  scenarios: EvalScenario[],
): { path: string } {
  const entries = collectMatcherDeficiencies({ scenarios, resultsDir, summary });
  const lines: string[] = [
    "# Matcher deficiency report",
    "",
    "Coverage terms present in brief but missed by evaluator.",
    "",
    `Run: \`${summary.runId}\` | Prompt: v${summary.promptVersion}`,
    "",
  ];

  const toFix = entries.filter((entry) => !entry.protected);
  const known = entries.filter((entry) => entry.protected);

  lines.push("## To fix (matcher)", "");
  if (toFix.length === 0) {
    lines.push("_No open matcher deficiencies._", "");
  } else {
    for (const entry of toFix) {
      lines.push(
        `- **${entry.scenarioId}** / \`${entry.term}\` (${entry.source}) — closest: ${entry.closestWord ?? "—"}`,
      );
    }
    lines.push("");
  }

  lines.push("## Known protected (tracked)", "");
  if (known.length === 0) {
    lines.push("_None._", "");
  } else {
    for (const entry of known) {
      const protectedEntry = getProtectedFixtureTerm(entry.scenarioId, entry.term);
      lines.push(
        `- **${entry.scenarioId}** / \`${entry.term}\` — ${protectedEntry?.reason ?? "protected"}`,
      );
    }
    lines.push("");
  }

  const outPath = join(resultsDir, "matcher-deficiency.md");
  writeFileSync(outPath, lines.join("\n"), "utf8");
  return { path: outPath };
}

function formatScenarioRow(
  result: ScenarioResult,
  issueClass: EvaluatorIssueClass,
): string {
  const score = result.evalMode === "fast" ? result.fastScore : result.overallScore;
  return `| ${result.id} | ${score} | ${result.coveragePercent}% | ${result.failReasons.join(", ") || "—"} | ${issueClass} |`;
}

export function writeEvaluatorFalsePositivesReport(
  repoRoot: string,
  resultsDir: string,
  summary: RunSummary,
  scenarios: EvalScenario[],
): { path: string } {
  const scenarioById = new Map(scenarios.map((s) => [s.id, s]));
  const lines: string[] = [
    "# Likely Evaluator False Positives",
    "",
    `Run: \`${summary.runId}\` | Prompt: v${summary.promptVersion}`,
    "",
  ];

  const classCounts: Record<string, number> = {};
  const matcherGaps: string[] = [];
  const fixtureUnrealistic: string[] = [];
  const mustNotFalsePositives: string[] = [];
  const promptGaps: string[] = [];
  const strictFilter: string[] = [];
  const extendedFilter: string[] = [];

  for (const result of Object.values(summary.scenarios)) {
    const fixture = scenarioById.get(result.id);
    const output = loadGeneratedEstimate(resultsDir, result.id);
    const ruleScore = loadRuleScore(resultsDir, result.id);
    const corpus = output ? buildEstimateCoverageCorpus(output) : "";

    const missedCoverage =
      result.coverageTotal > 0 && result.coverageMatched < result.coverageTotal
        ? (JSON.parse(
            existsSync(join(resultsDir, result.id, "coverage-score.json"))
              ? readFileSync(join(resultsDir, result.id, "coverage-score.json"), "utf8")
              : '{"missedTerms":[]}',
          ) as { missedTerms: string[] }).missedTerms
        : [];

    const failedMustHave =
      ruleScore?.checks
        .filter((c) => c.id.startsWith("mustHave:") && !c.passed)
        .map((c) => c.id.slice("mustHave:".length)) ?? [];
    const failedMustNot =
      ruleScore?.checks
        .filter((c) => c.id.startsWith("mustNotHave:") && !c.passed)
        .map((c) => c.id.slice("mustNotHave:".length)) ?? [];

    const issueClass = classifyScenarioIssues({
      result,
      fixture,
      corpus,
      output,
      ruleScore,
      missedCoverage,
      failedMustHave,
      failedMustNot,
    });

    if (issueClass !== "none") {
      classCounts[issueClass] = (classCounts[issueClass] ?? 0) + 1;
    }

    const overall = result.overallScore;
    if (!result.passed && result.coveragePercent >= 50 && overall >= 8) {
      strictFilter.push(formatScenarioRow(result, issueClass));
    }
    if (!result.passed && overall >= 7.5 && result.failReasons.includes("rules")) {
      extendedFilter.push(formatScenarioRow(result, issueClass));
    }

    for (const term of [...missedCoverage, ...failedMustHave]) {
      const explain = explainTermMismatch(corpus, term);
      if (explain.kind !== "not_in_corpus" && !explain.matched) {
        matcherGaps.push(
          `### ${result.id} — \`${term}\``,
          `- Closest word: ${explain.closestWord ?? "—"}`,
          `- Kind: ${explain.kind} | common prefix: ${explain.commonPrefixLength}`,
          `- Corpus excerpt: ${corpus.slice(0, 120)}${corpus.length > 120 ? "…" : ""}`,
          "",
        );
      } else if (!termInBrief(fixture?.request.project.description ?? "", term)) {
        if (!isProtectedFixtureTerm(result.id, term)) {
          fixtureUnrealistic.push(
            `- **${result.id}** — \`${term}\` (not in brief)`,
          );
        }
      } else if (
        explain.kind === "not_in_corpus" &&
        (missedCoverage.includes(term) || failedMustHave.includes(term))
      ) {
        promptGaps.push(`- **${result.id}** — \`${term}\` (in brief, absent from estimate)`);
      }
    }

    for (const term of failedMustNot) {
      if (output) {
        const hits = findMustNotHitsInExclusions(output, term);
        if (hits.length > 0) {
          mustNotFalsePositives.push(
            `- **${result.id}** — \`mustNotHave:${term}\` hit only in exclusion line(s): ${hits.map((h) => `"${h}"`).join(", ")}`,
          );
        }
      }
    }
  }

  const artifactCount =
    (classCounts.fixture_unrealistic ?? 0) +
    (classCounts.matcher_gap ?? 0) +
    (classCounts.mustNot_false_positive ?? 0);
  const realCount = classCounts.prompt_gap ?? 0;
  const judgeCount = classCounts.judge_threshold ?? 0;

  const gateTotal = summary.passed + summary.passedWithLowRefSim + summary.failed;
  lines.push(
    "## Executive summary",
    "",
    `- Correctness gate: **${summary.correctnessPassed}/${gateTotal}**`,
    `- Quality PASS: **${summary.passed}** | PASS (quality warning): **${summary.passedWithLowRefSim}** | FAIL: **${summary.failed}**`,
    summary.qualityKpis?.averageReferenceSimilarity != null
      ? `- Average RefSim (KPI): **${summary.qualityKpis.averageReferenceSimilarity}**`
      : "",
    `- Likely eval artifacts (fixture / matcher / mustNot): **${artifactCount}** scenario classifications`,
    `- Likely real prompt gaps: **${realCount}**`,
    `- Judge threshold only: **${judgeCount}**`,
    "",
    "## Strict filter (coverage ≥50%, overall ≥8, FAIL)",
    "",
    "| Scenario | Overall | Coverage | failReasons | Class |",
    "| --- | ---: | ---: | --- | --- |",
  );
  if (strictFilter.length === 0) {
    lines.push("| _none_ | | | | |");
  } else {
    lines.push(...strictFilter);
  }

  lines.push(
    "",
    "## Extended (overall ≥7.5, FAIL, rules)",
    "",
    "| Scenario | Overall | Coverage | failReasons | Class |",
    "| --- | ---: | ---: | --- | --- |",
  );
  if (extendedFilter.length === 0) {
    lines.push("| _none_ | | | | |");
  } else {
    lines.push(...extendedFilter);
  }

  lines.push("", ...formatProtectedTermsSection());

  lines.push("## Matcher gaps (term in corpus, polishTermMatch=false)", "");
  if (matcherGaps.length === 0) {
    lines.push("_No matcher gaps detected._", "");
  } else {
    lines.push(...matcherGaps);
  }

  lines.push("## Fixture unrealistic (term not in brief)", "");
  if (fixtureUnrealistic.length === 0) {
    lines.push("_None._", "");
  } else {
    lines.push(...fixtureUnrealistic, "");
  }

  lines.push("## mustNot false positives (exclusion lines only)", "");
  if (mustNotFalsePositives.length === 0) {
    lines.push("_None._", "");
  } else {
    lines.push(...mustNotFalsePositives, "");
  }

  lines.push("## Likely real prompt gaps", "");
  if (promptGaps.length === 0) {
    lines.push("_None._", "");
  } else {
    lines.push(...promptGaps, "");
  }

  lines.push(
    "## Recommended fix order",
    "",
    "1. Matcher v3 — najem/okna/copy and related stems",
    "2. Fixture cleanup v2 — remove terms not grounded in brief",
    "3. Prompt gaps — only after eval noise removed (e.g. accounting `faktur`)",
    "",
  );

  const outPath = join(resultsDir, "evaluator-false-positives.md");
  writeFileSync(outPath, lines.join("\n"), "utf8");
  writeMatcherDeficiencyReport(resultsDir, summary, scenarios);
  return { path: outPath };
}

export function writeEvaluatorAuditForRun(
  repoRoot: string,
  runId: string,
): { path: string } | null {
  const resultsDir = join(repoRoot, "evals", "results", runId);
  const summaryPath = join(resultsDir, "summary.json");
  if (!existsSync(summaryPath)) {
    return null;
  }
  const summary = JSON.parse(readFileSync(summaryPath, "utf8")) as RunSummary;
  const scenarios = loadServicesScenarios(repoRoot);
  return writeEvaluatorFalsePositivesReport(repoRoot, resultsDir, summary, scenarios);
}
