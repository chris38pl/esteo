import type { TokenUsage } from "@evals/engine/types";

/** OpenAI gpt-4o approximate pricing (USD per 1M tokens) — update when models change. */
const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
};

export function estimateCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const key = model.includes("mini") ? "gpt-4o-mini" : "gpt-4o";
  const rates = PRICING[key] ?? PRICING["gpt-4o"];
  const cost =
    (promptTokens / 1_000_000) * rates.input +
    (completionTokens / 1_000_000) * rates.output;
  return Math.round(cost * 10000) / 10000;
}

export function mergeUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    completionTokens: a.completionTokens + b.completionTokens,
    totalTokens: a.totalTokens + b.totalTokens,
  };
}

export function usageFromAiSdk(usage: {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
} | undefined): TokenUsage {
  const promptTokens = usage?.inputTokens ?? 0;
  const completionTokens = usage?.outputTokens ?? 0;
  return {
    promptTokens,
    completionTokens,
    totalTokens: usage?.totalTokens ?? promptTokens + completionTokens,
  };
}
