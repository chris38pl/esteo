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
import {
  formatEstimateTemplateBlock,
  formatPriceListBlock,
  type PromptPriceListBlock,
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
  rules: Array<{ title: string; content: string }>;
  templatePromptBlock?: string;
  priceListPromptBlock?: string;
  configurationSnapshot?: EstimateConfigurationSnapshot;
};

export type EstimateConfigurationSnapshot = {
  template?: {
    id: string;
    name: string;
    sections: Array<{
      title: string;
      guidance: string | null;
      items: Array<{
        name: string;
        unit: string | null;
        guidance: string | null;
      }>;
    }>;
  } | null;
  priceList?: {
    id: string;
    name: string;
    currency: string;
    items: Array<{
      name: string;
      unit: string;
      unitPrice: string;
      vatRate: string | null;
      note: string | null;
    }>;
  } | null;
};

export function estimateAiRulesApplied(context: EstimateGenerationContext): boolean {
  return Boolean(
    context.aiInstructions?.trim() ||
      context.companyDescription?.trim() ||
      context.estimateSections.length > 0 ||
      context.rules.length > 0 ||
      context.templatePromptBlock?.trim() ||
      context.priceListPromptBlock?.trim(),
  );
}

export async function loadEstimateGenerationContext(
  workspaceId: string,
  locale: Locale,
  options: {
    templateId?: string | null;
    priceListId?: string | null;
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
  const selectedTemplateId =
    options.templateId === undefined
      ? (settings?.defaultEstimateTemplateId ?? null)
      : options.templateId;
  const selectedPriceListId =
    options.priceListId === undefined
      ? (settings?.defaultPriceListId ?? null)
      : options.priceListId;

  const [template, priceList] = canUsePremiumConfiguration
    ? await Promise.all([
        selectedTemplateId
          ? prisma.estimateTemplate.findFirst({
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
          : Promise.resolve(null),
        selectedPriceListId
          ? prisma.priceList.findFirst({
              where: { id: selectedPriceListId, workspaceId, deletedAt: null },
              include: {
                items: {
                  where: { deletedAt: null },
                  orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
                  take: 200,
                },
              },
            })
          : Promise.resolve(null),
      ])
    : [null, null];

  const persistedSections = parseEstimateSectionsFromBranding(settings?.branding);
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

  const templateForPrompt: PromptTemplateBlock | null = template
    ? {
        name: template.name,
        sections: template.sections.map((section) => ({
          title: section.title,
          guidance: section.guidance,
          items: section.items.map((item) => ({
            name: item.name,
            unit: item.unit,
            guidance: item.guidance,
          })),
        })),
      }
    : null;

  const priceListForPrompt: PromptPriceListBlock | null = priceList
    ? {
        name: priceList.name,
        currency: priceList.currency,
        items: priceList.items.map((item) => ({
          name: item.name,
          unit: item.unit,
          unitPrice: item.unitPrice.toFixed(2),
          vatRate: item.vatRate?.toString() ?? null,
          note: item.note,
        })),
      }
    : null;

  const configurationSnapshot: EstimateConfigurationSnapshot = {
    template: template
      ? {
          id: template.id,
          name: template.name,
          sections: template.sections.map((section) => ({
            title: section.title,
            guidance: section.guidance,
            items: section.items.map((item) => ({
              name: item.name,
              unit: item.unit,
              guidance: item.guidance,
            })),
          })),
        }
      : null,
    priceList: priceList
      ? {
          id: priceList.id,
          name: priceList.name,
          currency: priceList.currency,
          items: priceList.items.map((item) => ({
            name: item.name,
            unit: item.unit,
            unitPrice: item.unitPrice.toFixed(2),
            vatRate: item.vatRate?.toString() ?? null,
            note: item.note,
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
    rules: [...activeSystemRules, ...userEstimateRules],
    templatePromptBlock: formatEstimateTemplateBlock(templateForPrompt),
    priceListPromptBlock: formatPriceListBlock(priceListForPrompt),
    configurationSnapshot,
  };
}
