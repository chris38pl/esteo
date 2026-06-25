import type { TemplateGenerationMode } from "@/ai/prompts/template-generation";

export const TEMPLATE_AI_PROMPT_STORAGE_KEY = "template-ai-prompt";
export const TEMPLATE_AI_MODE_STORAGE_KEY = "template-ai-mode";
export const TEMPLATE_AI_OPEN_QUERY_PARAM = "openAi";

export function storeTemplateAiSession(prompt: string, mode: TemplateGenerationMode): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(TEMPLATE_AI_PROMPT_STORAGE_KEY, prompt);
  sessionStorage.setItem(TEMPLATE_AI_MODE_STORAGE_KEY, mode);
}

export function readTemplateAiSession(): {
  prompt: string;
  mode: TemplateGenerationMode;
} | null {
  if (typeof window === "undefined") {
    return null;
  }

  const prompt = sessionStorage.getItem(TEMPLATE_AI_PROMPT_STORAGE_KEY)?.trim() ?? "";
  if (!prompt) {
    return null;
  }

  const modeRaw = sessionStorage.getItem(TEMPLATE_AI_MODE_STORAGE_KEY);
  const mode: TemplateGenerationMode = modeRaw === "faithful" ? "faithful" : "enhance";

  return { prompt, mode };
}

export function clearTemplateAiSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(TEMPLATE_AI_PROMPT_STORAGE_KEY);
  sessionStorage.removeItem(TEMPLATE_AI_MODE_STORAGE_KEY);
}
