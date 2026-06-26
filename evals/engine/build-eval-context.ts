import { WorkspaceIndustry } from "@prisma/client";

import {
  ESTIMATE_SYSTEM_RULE_IDS,
  ESTIMATE_SYSTEM_RULE_PROMPT,
  ESTIMATE_SYSTEM_RULE_PROMPT_PL,
} from "@/features/workspaces/lib/estimate-system-rules";
import {
  buildPromptBlocksFromConfigurationSnapshot,
  type EstimateConfigurationSnapshot,
} from "@/features/workspaces/lib/configuration-snapshot";
import {
  parseEstimateSectionsFromBranding,
  resolveEstimateSectionsForPrompt,
  resolveSectionStructureMode,
} from "@/features/workspaces/lib/resolve-estimate-sections";
import type { SectionStructureMode } from "@/features/workspaces/lib/section-structure-mode";
import type { EstimateGenerationContext } from "@/features/workspaces/lib/load-estimate-generation-context";
import { formatEstimateTemplateBlock } from "@/features/workspaces/lib/prompt-context";
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
  if (industry === "PLUMBING") {
    return WorkspaceIndustry.PLUMBING;
  }
  return WorkspaceIndustry.OTHER;
}

function canUsePremiumConfiguration(workspace: EvalScenario["workspace"]): boolean {
  const plan = workspace.subscriptionPlan ?? "PRO";
  const status = workspace.subscriptionStatus ?? "ACTIVE";
  return (
    (plan === "PRO" || plan === "BUSINESS") &&
    (status === "ACTIVE" || status === "PAST_DUE")
  );
}

function mapTemplateFixtureToSnapshot(
  template: NonNullable<EvalScenario["workspace"]["template"]>,
): NonNullable<EstimateConfigurationSnapshot["template"]> {
  return {
    id: template.id,
    name: template.name,
    generationMode: template.generationMode ?? "SMART",
    currency: template.currency ?? "PLN",
    sections: template.sections.map((section) => ({
      title: section.title,
      guidance: section.guidance ?? null,
      items: section.items.map((item) => ({
        name: item.name,
        unit: item.unit ?? null,
        unitPrice: item.unitPrice ?? null,
        vatRate: item.vatRate ?? null,
        note: item.note ?? null,
        guidance: item.guidance ?? null,
      })),
    })),
  };
}

function fixtureToConfigurationSnapshot(
  scenario: EvalScenario,
): EstimateConfigurationSnapshot | null {
  if (scenario.configurationSnapshot) {
    const snap = scenario.configurationSnapshot;
    return {
      template: snap.template ? mapTemplateFixtureToSnapshot(snap.template) : null,
    };
  }

  if (!canUsePremiumConfiguration(scenario.workspace)) {
    return null;
  }

  const { template } = scenario.workspace;
  if (!template) {
    return null;
  }

  return {
    template: mapTemplateFixtureToSnapshot(template),
  };
}

export type EvalContextSnapshot = {
  locale: EvalLocale;
  industry: WorkspaceIndustry;
  industryOtherText: string | null;
  companyDescription: string | null;
  aiInstructions: string | null;
  estimateSections: Array<{ key: string; title: string; rule: string }>;
  sectionStructureMode: SectionStructureMode;
  rules: Array<{ title: string; content: string }>;
  templatePromptBlock?: string;
  projectBrief: string;
  subscriptionPlan: EvalScenario["workspace"]["subscriptionPlan"];
  usesStoredSnapshot: boolean;
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

  const storedSnapshot = fixtureToConfigurationSnapshot(scenario);

  if (storedSnapshot) {
    const promptBlocks = buildPromptBlocksFromConfigurationSnapshot(storedSnapshot, locale);
    const estimateSections = storedSnapshot.template
      ? storedSnapshot.template.sections.map((section, index) => ({
          key: `snapshot-template:${index}`,
          title: section.title,
          rule: section.guidance ?? "",
        }))
      : resolveEstimateSectionsForPrompt(industry, persistedSections, locale).map(
          (section) => ({
            key: section.key,
            title: section.title,
            rule: section.rule,
          }),
        );

    const sectionStructureMode = storedSnapshot.template
      ? ("workspace_override" as const)
      : resolveSectionStructureMode(industry, persistedSections);

    return {
      industry,
      industryOtherText: scenario.workspace.industryOtherText?.trim() || null,
      locale,
      companyDescription: scenario.workspace.companyDescription || null,
      aiInstructions: scenario.workspace.aiInstructions ?? null,
      estimateSections,
      allowedSections: estimateSections.map((s) => ({ key: s.key, title: s.title })),
      sectionStructureMode,
      rules: [
        ...activeSystemRules.map((r) => ({ title: r.title, content: r.content })),
        ...userRules,
      ],
      templatePromptBlock: promptBlocks.templatePromptBlock,
      configurationSnapshot: storedSnapshot,
    };
  }

  const sectionStructureMode = scenario.workspace.template
    ? ("workspace_override" as const)
    : resolveSectionStructureMode(industry, persistedSections);

  const resolvedSections = scenario.workspace.template
    ? scenario.workspace.template.sections.map((section, index) => ({
        key: `template:${index}`,
        title: section.title,
        rule: section.guidance ?? "",
      }))
    : resolveEstimateSectionsForPrompt(industry, persistedSections, locale);

  const estimateSections = resolvedSections.map((section) => ({
    key: section.key,
    title: section.title,
    rule: section.rule,
  }));

  const liveSnapshot = fixtureToConfigurationSnapshot(scenario);
  const templatePromptBlock = liveSnapshot?.template
    ? formatEstimateTemplateBlock(
        {
          name: liveSnapshot.template.name,
          currency: liveSnapshot.template.currency,
          generationMode: liveSnapshot.template.generationMode,
          sections: liveSnapshot.template.sections.map((section) => ({
            title: section.title,
            guidance: section.guidance,
            items: section.items.map((item) => ({
              name: item.name,
              unit: item.unit,
              unitPrice: item.unitPrice,
              vatRate: item.vatRate,
              note: item.note,
              guidance: item.guidance,
            })),
          })),
        },
        locale,
      )
    : "";

  return {
    industry,
    industryOtherText: scenario.workspace.industryOtherText?.trim() || null,
    locale,
    companyDescription: scenario.workspace.companyDescription || null,
    aiInstructions: scenario.workspace.aiInstructions ?? null,
    estimateSections,
    allowedSections: estimateSections.map((s) => ({ key: s.key, title: s.title })),
    sectionStructureMode,
    rules: [
      ...activeSystemRules.map((r) => ({ title: r.title, content: r.content })),
      ...userRules,
    ],
    templatePromptBlock,
    configurationSnapshot: liveSnapshot ?? { template: null },
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
    sectionStructureMode: context.sectionStructureMode,
    rules: context.rules,
    templatePromptBlock: context.templatePromptBlock,
    projectBrief,
    subscriptionPlan: scenario.workspace.subscriptionPlan ?? "PRO",
    usesStoredSnapshot: scenario.configurationSnapshot !== undefined,
  };
}

/** Build generation context for assistant eval (no project brief). */
export function buildAssistantEvalContext(
  scenario: Pick<EvalScenario, "locale" | "workspace" | "configurationSnapshot">,
): EstimateGenerationContext {
  return buildEvalGenerationContext({
    id: "assistant-eval",
    name: "assistant-eval",
    locale: scenario.locale,
    category: "business",
    quick: false,
    critical: false,
    workspace: scenario.workspace,
    configurationSnapshot: scenario.configurationSnapshot,
    request: { project: { description: "" } },
    expectations: {
      mustHave: [],
      mustNotHave: [],
      coverageTerms: [],
      requiredSections: [],
      forbiddenSections: [],
      leakageDomain: "construction",
      maxLeakageTerms: 0,
      minLineItems: 0,
      maxLineItems: 100,
    },
  });
}
