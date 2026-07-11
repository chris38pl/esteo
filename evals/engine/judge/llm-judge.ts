import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod/v3";

import type { EstimateDraftOutput } from "@/ai/schemas/estimate-draft-output";
import { usageFromAiSdk, estimateCostUsd } from "@evals/engine/cost/cost-tracker";
import type { EvalContextSnapshot } from "@evals/engine/build-eval-context";
import type { EvalScenario } from "@evals/engine/schemas/scenario";
import type { JudgeResult } from "@evals/engine/types";

const judgeResultSchema = z.object({
  score: z.number().min(0).max(10),
  referenceSimilarity: z.number().min(0).max(10),
  contextAlignment: z.number().min(0).max(10),
  structureScore: z.number().min(0).max(10),
  strengths: z.array(z.string()),
  issues: z.array(z.string()),
  hallucinations: z.array(z.string()),
});

export type JudgeRunResult = {
  result: JudgeResult;
  usage: ReturnType<typeof usageFromAiSdk>;
  estimatedCostUsd: number;
  model: string;
};

export async function runLlmJudge(
  scenario: EvalScenario,
  context: EvalContextSnapshot,
  generated: EstimateDraftOutput,
): Promise<JudgeRunResult> {
  const modelName = process.env.EVAL_JUDGE_MODEL ?? "gpt-4o-mini";
  const focus = scenario.expectations.judge?.focus ?? [];
  const referenceBlock = scenario.referenceEstimate
    ? `\n## Reference Estimate (expected scope)\n${JSON.stringify(scenario.referenceEstimate, null, 2)}`
    : "";

  const prompt = `You evaluate a services estimate draft for a Polish business workspace.

Score from 0-10. Do not nitpick exact PLN prices - evaluate scope, structure, and business fit.

Criteria:
- Completeness relative to the project brief
- Alignment with company context, business type, and workspace rules
- Similarity of service scope to the reference estimate when provided (not exact names/prices)
- No hallucinated services outside company scope
- Section structure matches workspace configuration

${focus.length > 0 ? `Additional focus:\n${focus.map((f) => `- ${f}`).join("\n")}` : ""}

## Business Type
${context.industryOtherText ?? "(none)"}

## Company Context
${context.companyDescription ?? "(empty)"}

## Workspace Rules
${context.aiInstructions ?? "(none)"}

## Active Rules
${context.rules.map((r) => `### ${r.title}\n${r.content}`).join("\n\n") || "(none)"}

## Project Brief
${context.projectBrief}
${referenceBlock}

## Generated Estimate
${JSON.stringify(generated, null, 2)}

Return structured scores. referenceSimilarity: how well generated scope matches reference (10 = same scope, 0 = unrelated). Use 7+ when no reference provided if scope is reasonable.`;

  const { object, usage } = await generateObject({
    model: openai(modelName),
    schema: judgeResultSchema,
    schemaName: "ServicesEstimateJudge",
    schemaDescription: "Quality judgment for a services estimate draft.",
    prompt,
    temperature: 0,
  });

  const tokenUsage = usageFromAiSdk(usage);

  return {
    result: {
      score: object.score,
      referenceSimilarity: object.referenceSimilarity,
      contextAlignment: object.contextAlignment,
      structureScore: object.structureScore,
      strengths: object.strengths,
      issues: object.issues,
      hallucinations: object.hallucinations,
    },
    usage: tokenUsage,
    estimatedCostUsd: estimateCostUsd(
      modelName,
      tokenUsage.promptTokens,
      tokenUsage.completionTokens,
    ),
    model: modelName,
  };
}
