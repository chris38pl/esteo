import { WorkspaceIndustry } from "@prisma/client";

import {
  ESTIMATE_SYSTEM_RULE_IDS,
  ESTIMATE_SYSTEM_RULE_PROMPT,
  ESTIMATE_SYSTEM_RULE_PROMPT_PL,
} from "@/features/workspaces/lib/estimate-system-rules";
import { resolveEstimateSectionsForPrompt } from "@/features/workspaces/lib/resolve-estimate-sections";
import type { EstimateGenerationContext } from "@/features/workspaces/lib/load-estimate-generation-context";
import type { WorkspaceEstimateSection } from "@/features/workspaces/schemas/estimate-sections";
import type { EvalLocale, EvalScenario } from "@evals/engine/schemas/scenario";

function resolveEvalWorkspaceIndustry(
  industry: EvalScenario["workspace"]["industry"],
): WorkspaceIndustry {
  if (industry === "CONSTRUCTION") {
    return WorkspaceIndustry.CONSTRUCTION;
  }
  if (industry === "CARPENTRY") {
    return WorkspaceIndustry.CARPENTRY;
  }
  if (industry === "ELECTRICAL") {
    return WorkspaceIndustry.ELECTRICAL;
  }
  return WorkspaceIndustry.OTHER;
}

export type EvalContextSnapshot = {
  locale: EvalLocale;
  industry: WorkspaceIndustry;
  industryOtherText: string | null;
  companyDescription: string | null;
  aiInstructions: string | null;
  estimateSections: Array<{ key: string; title: string; rule: string }>;
  rules: Array<{ title: string; content: string }>;
  projectBrief: string;
};

export function buildEvalGenerationContext(
  scenario: EvalScenario,
): EstimateGenerationContext {
  const locale = scenario.locale;
  const industry = resolveEvalWorkspaceIndustry(scenario.workspace.industry);
  const systemRules = scenario.workspace.systemRules ?? {};
  const systemRulePrompts =
    locale === "pl" ? ESTIMATE_SYSTEM_RULE_PROMPT_PL : ESTIMATE_SYSTEM_RULE_PROMPT;

  const activeSystemRules = ESTIMATE_SYSTEM_RULE_IDS.filter((id) => systemRules[id]).map(
    (id) => systemRulePrompts[id],
  );

  const userRules = scenario.workspace.rules.map((r) => ({
    title: r.title,
    content: r.content,
  }));

  const persistedSections: WorkspaceEstimateSection[] | null = scenario.workspace
    .estimateSections
    ? scenario.workspace.estimateSections.map((s) => ({
        key: s.key,
        titlePl: s.titlePl,
        titleEn: s.titleEn,
        rulePl: s.rulePl,
        ruleEn: s.ruleEn,
        active: s.active ?? true,
      }))
    : null;

  const resolvedSections = resolveEstimateSectionsForPrompt(
    industry,
    persistedSections,
    locale,
  );

  const estimateSections = resolvedSections.map((section) => ({
    key: section.key,
    title: section.title,
    rule: section.rule,
  }));

  return {
    industry,
    industryOtherText: scenario.workspace.industryOtherText?.trim() || null,
    locale,
    companyDescription: scenario.workspace.companyDescription || null,
    aiInstructions: scenario.workspace.aiInstructions ?? null,
    estimateSections,
    allowedSections: estimateSections.map((s) => ({ key: s.key, title: s.title })),
    rules: [
      ...activeSystemRules.map((r) => ({ title: r.title, content: r.content })),
      ...userRules,
    ],
  };
}

export function buildContextSnapshot(
  scenario: EvalScenario,
  projectBrief: string,
): EvalContextSnapshot {
  const context = buildEvalGenerationContext(scenario);
  return {
    locale: scenario.locale,
    industry: context.industry,
    industryOtherText: context.industryOtherText,
    companyDescription: context.companyDescription,
    aiInstructions: context.aiInstructions,
    estimateSections: context.estimateSections,
    rules: context.rules,
    projectBrief,
  };
}
