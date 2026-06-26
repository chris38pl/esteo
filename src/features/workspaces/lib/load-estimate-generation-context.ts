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
  resolveSectionStructureMode,
} from "@/features/workspaces/lib/resolve-estimate-sections";
import type { SectionStructureMode } from "@/features/workspaces/lib/section-structure-mode";
import { buildPromptBlocksFromConfigurationSnapshot } from "@/features/workspaces/lib/configuration-snapshot";
import type { EstimateConfigurationSnapshot } from "@/features/workspaces/lib/configuration-snapshot";
import {
  formatEstimateTemplateBlock,
  type PromptTemplateBlock,
} from "@/features/workspaces/lib/prompt-context";
import { workspaceBrandingSchema } from "@/features/workspaces/schemas/branding";
import {
  findWorkspaceById,
  findWorkspaceSettings,
  listActiveWorkspaceRules,
} from "@/features/workspaces/server/repository";
import { prisma } from "@/db/client";
import type { Locale } from "@/lib/locale";
import { appLocaleToWorkspaceLocale } from "@/lib/workspace-locale";
import { getWorkspaceEntitlements } from "@/server/billing/entitlement-service";

export type EstimatePromptSection = {
  key: string;
  title: string;
  rule: string;
};

export type EstimateGenerationContext = {
  industry: WorkspaceIndustry;
  industryOtherText: string | null;
  locale: Locale;
  companyDescription: string | null;
  aiInstructions: string | null;
  estimateSections: EstimatePromptSection[];
  allowedSections: Array<{ key: string; title: string }>;
  sectionStructureMode: SectionStructureMode;
  rules: Array<{ title: string; content: string }>;
  templatePromptBlock?: string;
  configurationSnapshot?: EstimateConfigurationSnapshot;
};

export type { EstimateConfigurationSnapshot } from "@/features/workspaces/lib/configuration-snapshot";

export function estimateAiRulesApplied(context: EstimateGenerationContext): boolean {
  return Boolean(
    context.aiInstructions?.trim() ||
      context.companyDescription?.trim() ||
      context.sectionStructureMode !== "ai_dynamic" ||
      context.estimateSections.length > 0 ||
      context.rules.length > 0 ||
      context.templatePromptBlock?.trim(),
  );
}

export async function loadEstimateGenerationContext(
  workspaceId: string,
  locale: Locale,
  options: {
    templateId?: string | null;
    configurationSnapshot?: EstimateConfigurationSnapshot;
  } = {},
): Promise<EstimateGenerationContext | null> {
  const workspaceLocale = appLocaleToWorkspaceLocale(locale);

  const [workspace, settings, rules, entitlements] = await Promise.all([
    findWorkspaceById(workspaceId),
    findWorkspaceSettings(workspaceId),
    listActiveWorkspaceRules(workspaceId, workspaceLocale),
    getWorkspaceEntitlements(workspaceId),
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

  const canUsePremiumConfiguration =
    (entitlements.plan === "PRO" || entitlements.plan === "BUSINESS") &&
    (entitlements.effectiveStatus === "ACTIVE" ||
      entitlements.effectiveStatus === "PAST_DUE");

  const persistedSections = parseEstimateSectionsFromBranding(settings?.branding);
  const sectionStructureMode = resolveSectionStructureMode(
    workspace.industry,
    persistedSections,
  );
  const brandingSections = resolveEstimateSectionsForPrompt(
    workspace.industry,
    persistedSections,
    locale,
  );

  if (options.configurationSnapshot !== undefined) {
    const snapshot = options.configurationSnapshot;
    const promptBlocks = buildPromptBlocksFromConfigurationSnapshot(snapshot, locale);
    const estimateSections = snapshot.template
      ? snapshot.template.sections.map((section, index) => ({
          key: `snapshot-template:${index}`,
          title: section.title,
          rule: section.guidance ?? "",
        }))
      : brandingSections.map((section) => ({
          key: section.key,
          title: section.title,
          rule: section.rule,
        }));

    return {
      industry: workspace.industry,
      industryOtherText: workspace.industryOtherText ?? null,
      locale,
      companyDescription: settings?.companyDescription ?? null,
      aiInstructions: settings?.aiInstructions ?? null,
      estimateSections,
      allowedSections: estimateSections.map((s) => ({ key: s.key, title: s.title })),
      sectionStructureMode,
      rules: [...activeSystemRules, ...userEstimateRules],
      templatePromptBlock: promptBlocks.templatePromptBlock,
      configurationSnapshot: snapshot,
    };
  }

  const selectedTemplateId =
    options.templateId === undefined
      ? (settings?.defaultEstimateTemplateId ?? null)
      : options.templateId;

  const template = canUsePremiumConfiguration && selectedTemplateId
    ? await prisma.estimateTemplate.findFirst({
        where: { id: selectedTemplateId, workspaceId, deletedAt: null },
        include: {
          sections: {
            where: { deletedAt: null },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            include: {
              items: {
                where: { deletedAt: null },
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
              },
            },
          },
        },
      })
    : null;

  const resolvedSections = template
    ? template.sections.map((section) => ({
        key: `template:${section.id}`,
        title: section.title,
        rule: section.guidance ?? "",
      }))
    : resolveEstimateSectionsForPrompt(
        workspace.industry,
        persistedSections,
        locale,
      );

  const estimateSections = resolvedSections.map((section) => ({
    key: section.key,
    title: section.title,
    rule: section.rule,
  }));

  const resolvedStructureMode = template
    ? ("workspace_override" as const)
    : sectionStructureMode;

  const templateForPrompt: PromptTemplateBlock | null = template
    ? {
        name: template.name,
        currency: template.currency,
        generationMode: template.generationMode,
        sections: template.sections.map((section) => ({
          title: section.title,
          guidance: section.guidance,
          items: section.items.map((item) => ({
            name: item.name,
            unit: item.unit,
            unitPrice: item.unitPrice ? item.unitPrice.toFixed(2) : null,
            vatRate: item.vatRate ? item.vatRate.toString() : null,
            note: item.note,
            guidance: item.guidance,
          })),
        })),
      }
    : null;

  const configurationSnapshot: EstimateConfigurationSnapshot = {
    template: template
      ? {
          id: template.id,
          name: template.name,
          generationMode: template.generationMode,
          currency: template.currency,
          sections: template.sections.map((section) => ({
            title: section.title,
            guidance: section.guidance,
            items: section.items.map((item) => ({
              name: item.name,
              unit: item.unit,
              unitPrice: item.unitPrice ? item.unitPrice.toFixed(2) : null,
              vatRate: item.vatRate ? item.vatRate.toString() : null,
              note: item.note,
              guidance: item.guidance,
            })),
          })),
        }
      : null,
  };

  return {
    industry: workspace.industry,
    industryOtherText: workspace.industryOtherText ?? null,
    locale,
    companyDescription: settings?.companyDescription ?? null,
    aiInstructions: settings?.aiInstructions ?? null,
    estimateSections,
    allowedSections: estimateSections.map((s) => ({ key: s.key, title: s.title })),
    sectionStructureMode: resolvedStructureMode,
    rules: [...activeSystemRules, ...userEstimateRules],
    templatePromptBlock: formatEstimateTemplateBlock(templateForPrompt, locale),
    configurationSnapshot,
  };
}
