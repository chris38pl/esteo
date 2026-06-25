import type { WorkspaceIndustry } from "@prisma/client";

import {
  getIndustryEstimateSectionTemplate,
  hasIndustrySectionDefaults,
  type IndustryEstimateSectionDefinition,
} from "@/features/workspaces/config/industry-estimate-sections";
import {
  resolveSectionStructureMode,
  type SectionStructureMode,
} from "@/features/workspaces/lib/section-structure-mode";
import type { WorkspaceEstimateSection } from "@/features/workspaces/schemas/estimate-sections";
import { workspaceBrandingSchema } from "@/features/workspaces/schemas/branding";
import type { Locale } from "@/lib/locale";

export type { SectionStructureMode } from "@/features/workspaces/lib/section-structure-mode";
export { resolveSectionStructureMode } from "@/features/workspaces/lib/section-structure-mode";

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
  const template = getIndustryEstimateSectionTemplate(industry);
  if (!template) {
    return [];
  }
  return template.map((definition) => definitionToWorkspaceSection(definition));
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

export function resolveWorkspaceEstimateSections(
  industry: WorkspaceIndustry,
  persisted: WorkspaceEstimateSection[] | null | undefined,
): WorkspaceEstimateSection[] {
  if (persisted != null) {
    return persisted;
  }
  return industryDefaultsToWorkspaceSections(industry);
}

export function resolveEstimateSectionsForUi(
  industry: WorkspaceIndustry,
  persisted: WorkspaceEstimateSection[] | null | undefined,
  locale: Locale,
): ResolvedEstimateSection[] {
  const sections = resolveWorkspaceEstimateSections(industry, persisted);

  const template = getIndustryEstimateSectionTemplate(industry);
  const templateKeys = new Set(template?.map((definition) => definition.key) ?? []);

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
  if (!parsed.success || parsed.data.estimateSections === undefined) {
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
  const mode = resolveSectionStructureMode(industry, persisted);
  if (mode === "ai_dynamic") {
    return [];
  }

  return resolveEstimateSectionsForUi(industry, persisted, locale).filter(
    (section) => section.active,
  );
}

export function isAiDynamicSectionStructure(
  industry: WorkspaceIndustry,
  persisted: WorkspaceEstimateSection[] | null | undefined,
): boolean {
  return resolveSectionStructureMode(industry, persisted) === "ai_dynamic";
}
