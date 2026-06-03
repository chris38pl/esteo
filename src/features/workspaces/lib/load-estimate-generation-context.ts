import type { WorkspaceIndustry } from "@prisma/client";

import {
  ESTIMATE_SYSTEM_RULE_IDS,
  ESTIMATE_SYSTEM_RULE_PROMPT,
  ESTIMATE_SYSTEM_RULE_PROMPT_PL,
} from "@/features/workspaces/lib/estimate-system-rules";
import { parseEstimateSystemRuleState } from "@/features/workspaces/lib/parse-estimate-system-rule-state";
import {
  parseEstimateSectionsFromBranding,
  resolveEstimateSectionsForPrompt,
} from "@/features/workspaces/lib/resolve-estimate-sections";
import { workspaceBrandingSchema } from "@/features/workspaces/schemas/branding";
import {
  findWorkspaceById,
  findWorkspaceSettings,
  listActiveWorkspaceRules,
} from "@/features/workspaces/server/repository";
import type { Locale } from "@/lib/locale";
import { appLocaleToWorkspaceLocale } from "@/lib/workspace-locale";

export type EstimatePromptSection = {
  key: string;
  title: string;
  rule: string;
};

export type EstimateGenerationContext = {
  industry: WorkspaceIndustry;
  locale: Locale;
  companyDescription: string | null;
  aiInstructions: string | null;
  estimateSections: EstimatePromptSection[];
  allowedSections: Array<{ key: string; title: string }>;
  rules: Array<{ title: string; content: string }>;
};

export function estimateAiRulesApplied(context: EstimateGenerationContext): boolean {
  return Boolean(
    context.aiInstructions?.trim() ||
      context.companyDescription?.trim() ||
      context.estimateSections.length > 0 ||
      context.rules.length > 0,
  );
}

export async function loadEstimateGenerationContext(
  workspaceId: string,
  locale: Locale,
): Promise<EstimateGenerationContext | null> {
  const workspaceLocale = appLocaleToWorkspaceLocale(locale);

  const [workspace, settings, rules] = await Promise.all([
    findWorkspaceById(workspaceId),
    findWorkspaceSettings(workspaceId),
    listActiveWorkspaceRules(workspaceId, workspaceLocale),
  ]);

  if (!workspace) {
    return null;
  }

  const brandingResult = workspaceBrandingSchema.safeParse(settings?.branding ?? {});
  const branding = brandingResult.success ? brandingResult.data : null;
  const systemRuleState = parseEstimateSystemRuleState(branding);

  const systemRulePrompts =
    locale === "pl" ? ESTIMATE_SYSTEM_RULE_PROMPT_PL : ESTIMATE_SYSTEM_RULE_PROMPT;

  const activeSystemRules = ESTIMATE_SYSTEM_RULE_IDS.filter((id) => systemRuleState[id]).map(
    (id) => systemRulePrompts[id],
  );

  const userEstimateRules = rules
    .filter((rule) => rule.type === "ESTIMATE")
    .map((rule) => ({ title: rule.title, content: rule.content }));

  const persistedSections = parseEstimateSectionsFromBranding(settings?.branding);
  const resolvedSections = resolveEstimateSectionsForPrompt(
    workspace.industry,
    persistedSections,
    locale,
  );

  const estimateSections = resolvedSections.map((section) => ({
    key: section.key,
    title: section.title,
    rule: section.rule,
  }));

  return {
    industry: workspace.industry,
    locale,
    companyDescription: settings?.companyDescription ?? null,
    aiInstructions: settings?.aiInstructions ?? null,
    estimateSections,
    allowedSections: estimateSections.map((s) => ({ key: s.key, title: s.title })),
    rules: [...activeSystemRules, ...userEstimateRules],
  };
}
