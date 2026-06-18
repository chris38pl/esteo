import type { EstimateDraftOutput } from "@/ai/schemas/estimate-draft-output";
import type { ScenarioCategory } from "@evals/engine/schemas/scenario";

export type EvalMode = "fast" | "full";

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
  length: LengthMetrics;
  cost: ScenarioCost;
  promptMeta: PromptMeta;
  passed: boolean;
  failReasons: string[];
  generatedEstimate: EstimateDraftOutput | null;
};

export type RunSummary = {
  runId: string;
  evalMode: EvalMode;
  promptVersion: string;
  gitSha: string | null;
  startedAt: string;
  durationMs: number;
  businessAverageScore: number;
  businessAverageContextAlignment: number | null;
  businessAverageCoverage: number;
  edgeAverageScore: number;
  edgeAverageContextAlignment: number | null;
  edgeAverageCoverage: number;
  goldenAverageScore: number | null;
  goldenAverageContextAlignment: number | null;
  passed: number;
  failed: number;
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
