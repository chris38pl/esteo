import type { WorkspaceIndustry } from "@prisma/client";

import {
  getIndustryEstimateSectionTemplate,
  type IndustryEstimateSectionDefinition,
} from "@/features/workspaces/config/industry-estimate-sections";
import type { WorkspaceEstimateSection } from "@/features/workspaces/schemas/estimate-sections";
import { workspaceBrandingSchema } from "@/features/workspaces/schemas/branding";
import type { Locale } from "@/lib/locale";

export type ResolvedEstimateSection = {
  key: string;
  title: string;
  rule: string;
  active: boolean;
  isCustom: boolean;
};

function pickLocalized(
  text: { pl: string; en: string },
  locale: Locale,
): string {
  return locale === "en" ? text.en : text.pl;
}

export function industryDefaultsToWorkspaceSections(
  industry: WorkspaceIndustry,
): WorkspaceEstimateSection[] {
  return getIndustryEstimateSectionTemplate(industry).map((definition) =>
    definitionToWorkspaceSection(definition),
  );
}

export function definitionToWorkspaceSection(
  definition: IndustryEstimateSectionDefinition,
): WorkspaceEstimateSection {
  return {
    key: definition.key,
    titlePl: definition.title.pl,
    titleEn: definition.title.en,
    rulePl: definition.defaultRule.pl,
    ruleEn: definition.defaultRule.en,
    active: true,
  };
}

export function resolveEstimateSectionTitle(
  section: WorkspaceEstimateSection,
  locale: Locale,
): string {
  return locale === "en" ? section.titleEn : section.titlePl;
}

export function resolveEstimateSectionRule(
  section: WorkspaceEstimateSection,
  locale: Locale,
): string {
  const rule = locale === "en" ? section.ruleEn : section.rulePl;
  return rule?.trim() ?? "";
}

export function resolveEstimateSectionsForUi(
  industry: WorkspaceIndustry,
  persisted: WorkspaceEstimateSection[] | null | undefined,
  locale: Locale,
): ResolvedEstimateSection[] {
  const sections =
    persisted && persisted.length > 0
      ? persisted
      : industryDefaultsToWorkspaceSections(industry);

  const templateKeys = new Set(
    getIndustryEstimateSectionTemplate(industry).map((definition) => definition.key),
  );

  return sections.map((section) => ({
    key: section.key,
    title: resolveEstimateSectionTitle(section, locale),
    rule: resolveEstimateSectionRule(section, locale),
    active: section.active,
    isCustom: !templateKeys.has(section.key),
  }));
}

export function parseEstimateSectionsFromBranding(
  branding: unknown,
): WorkspaceEstimateSection[] | null {
  const parsed = workspaceBrandingSchema.safeParse(branding ?? {});
  if (!parsed.success || !parsed.data.estimateSections?.length) {
    return null;
  }

  return parsed.data.estimateSections;
}

export function createCustomSectionKey(): string {
  return `custom_${Date.now().toString(36)}`;
}

export function resolveEstimateSectionsForPrompt(
  industry: WorkspaceIndustry,
  persisted: WorkspaceEstimateSection[] | null | undefined,
  locale: Locale,
): ResolvedEstimateSection[] {
  return resolveEstimateSectionsForUi(industry, persisted, locale).filter(
    (section) => section.active,
  );
}
