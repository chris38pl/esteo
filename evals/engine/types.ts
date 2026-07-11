import type { EstimateDraftOutput } from "@/ai/schemas/estimate-draft-output";
import type { ScenarioCategory } from "@evals/engine/schemas/scenario";

export type EvalMode = "fast" | "full";

/** Release gate vs quality signal - see composite-score.determinePassed */
export type EvalPassClassification = "PASS" | "PASS_WITH_LOW_REFSIM" | "FAIL";

export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type ScenarioCost = TokenUsage & {
  judgePromptTokens?: number;
  judgeCompletionTokens?: number;
  estimatedCostUsd: number;
};

export type PromptComplexity = {
  promptCharacters: number;
  promptWords: number;
  promptSections: number;
};

export type PromptMeta = PromptComplexity & {
  promptVersion: string;
  promptHash: string;
};

export type SchemaScoreResult = {
  passed: boolean;
  checks: Array<{ id: string; passed: boolean; detail: string }>;
};

export type RuleScoreResult = {
  score: number;
  passed: boolean;
  checks: Array<{ id: string; passed: boolean; detail: string }>;
};

export type CoverageScoreResult = {
  matched: number;
  total: number;
  percent: number;
  matchedTerms: string[];
  missedTerms: string[];
};

export type LeakageScoreResult = {
  score: number;
  detectedTerms: string[];
  passed: boolean;
  domain: string;
};

export type LengthMetrics = {
  sectionCount: number;
  lineItemCount: number;
  outputTokens: number;
  avgItemsPerSection: number;
};

export type JudgeResult = {
  score: number;
  referenceSimilarity: number;
  contextAlignment: number;
  structureScore: number;
  strengths: string[];
  issues: string[];
  hallucinations: string[];
};

export type StabilityResult = {
  runs: number;
  scores: number[];
  contextAlignments: number[];
  scoreVariance: number;
  contextVariance: number;
  passed: boolean;
};

export type ScenarioResult = {
  id: string;
  name: string;
  category: ScenarioCategory;
  critical: boolean;
  evalMode: EvalMode;
  schemaPassed: boolean;
  fastScore: number;
  overallScore: number;
  ruleScore: number;
  judgeScore: number | null;
  contextAlignmentScore: number | null;
  referenceSimilarityScore: number | null;
  coveragePercent: number;
  coverageMatched: number;
  coverageTotal: number;
  leakageScore: number;
  leakagePassed: boolean;
  leakageTerms: string[];
  configurationScore: number;
  configurationPassed: boolean;
  length: LengthMetrics;
  cost: ScenarioCost;
  promptMeta: PromptMeta;
  classification: EvalPassClassification;
  /** Strict pass (classification === PASS). */
  passed: boolean;
  /** Release gate - correctness without referenceSimilarity block. */
  correctnessPassed: boolean;
  failReasons: string[];
  correctnessFailReasons: string[];
  qualityFailReasons: string[];
  generatedEstimate: EstimateDraftOutput | null;
};

export type RunSummary = {
  runId: string;
  evalMode: EvalMode;
  promptVersion: string;
  /** Representative hash (wedding-planner) for quick diff */
  promptHash: string;
  promptHashSource: string;
  /** Per-scenario prompt hashes - detects partial hotfixes */
  promptHashes: Record<string, string>;
  gitSha: string | null;
  startedAt: string;
  durationMs: number;
  businessAverageScore: number;
  businessAverageContextAlignment: number | null;
  businessAverageCoverage: number;
  edgeAverageScore: number;
  edgeAverageContextAlignment: number | null;
  edgeAverageCoverage: number;
  genericAverageScore: number;
  genericAverageContextAlignment: number | null;
  genericAverageCoverage: number;
  goldenAverageScore: number | null;
  goldenAverageContextAlignment: number | null;
  passed: number;
  passedWithLowRefSim: number;
  failed: number;
  correctnessPassed: number;
  qualityKpis: {
    averageReferenceSimilarity: number | null;
    averageJudgeScore: number | null;
    averageContextAlignment: number | null;
    goldenAverageReferenceSimilarity: number | null;
  } | null;
  cost: {
    promptTokens: number;
    completionTokens: number;
    judgeTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
  };
  promptComplexity: {
    avgWords: number;
    avgCharacters: number;
    avgSections: number;
    maxWords: number;
    maxWordsScenario: string | null;
  };
  lengthBenchmark: {
    avgLineItems: number;
    avgSectionCount: number;
    avgOutputTokens: number;
  };
  scenarios: Record<string, ScenarioResult>;
};
