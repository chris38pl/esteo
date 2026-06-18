import { createHash } from "node:crypto";

import type { PromptComplexity } from "@evals/engine/types";

export function hashPrompt(prompt: string): string {
  return `sha256:${createHash("sha256").update(prompt, "utf8").digest("hex")}`;
}

export function measurePromptComplexity(prompt: string): PromptComplexity {
  const trimmed = prompt.trim();
  const sections = (prompt.match(/^## /gm) ?? []).length;
  const words = trimmed.length > 0 ? trimmed.split(/\s+/).length : 0;
  return {
    promptCharacters: prompt.length,
    promptWords: words,
    promptSections: sections,
  };
}
