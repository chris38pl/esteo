import type { WorkspaceIndustry, WorkspaceRuleType } from "@prisma/client";

import { COMPANY_DESCRIPTION_RICH_CONTEXT_MIN_LENGTH } from "@/features/workspaces/schemas/company-description";
import type { WorkspaceEstimateSection } from "@/features/workspaces/schemas/estimate-sections";
import {
  industryDefaultsToWorkspaceSections,
  resolveEstimateSectionRule,
  resolveEstimateSectionTitle,
} from "@/features/workspaces/lib/resolve-estimate-sections";
import { hasIndustrySectionDefaults } from "@/features/workspaces/config/industry-estimate-sections";
import { isServiceWorkspace } from "@/features/workspaces/lib/industries";
import type { Locale } from "@/lib/locale";

export type AiReadinessCriterionKey =
  | "businessType"
  | "companyDescription"
  | "domainRulesOrRichDescription"
  | "customSections";

export type AiReadinessCriterion = {
  key: AiReadinessCriterionKey;
  met: boolean;
  weight: number;
};

export type AiReadinessScore = {
  percent: number;
  criteria: AiReadinessCriterion[];
};

const CRITERION_WEIGHT = 25;

export function hasBusinessTypeConfigured(
  industry: WorkspaceIndustry,
  industryOtherText: string | null | undefined,
): boolean {
  if (!isServiceWorkspace(industry)) {
    return true;
  }
  return (industryOtherText?.trim().length ?? 0) >= 3;
}

export function hasCompanyDescriptionConfigured(
  companyDescription: string | null | undefined,
): boolean {
  return Boolean(companyDescription?.trim());
}

export function hasRichDomainContext(
  companyDescription: string | null | undefined,
): boolean {
  return (companyDescription?.trim().length ?? 0) > COMPANY_DESCRIPTION_RICH_CONTEXT_MIN_LENGTH;
}

export function hasEstimateWorkspaceRule(
  rules: Array<{ type: WorkspaceRuleType; active?: boolean }>,
): boolean {
  return rules.some((rule) => rule.type === "ESTIMATE");
}

export function hasDomainRulesOrRichDescription(input: {
  companyDescription: string | null | undefined;
  rules: Array<{ type: WorkspaceRuleType; active?: boolean }>;
}): boolean {
  return (
    hasEstimateWorkspaceRule(input.rules) ||
    hasRichDomainContext(input.companyDescription)
  );
}

function sectionsEqual(
  a: WorkspaceEstimateSection[],
  b: WorkspaceEstimateSection[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((section, index) => {
    const other = b[index];
    return (
      section.key === other.key &&
      section.titlePl === other.titlePl &&
      section.titleEn === other.titleEn &&
      section.rulePl === other.rulePl &&
      section.ruleEn === other.ruleEn &&
      section.active === other.active
    );
  });
}

export function hasCustomEstimateSections(
  industry: WorkspaceIndustry,
  persisted: WorkspaceEstimateSection[] | null | undefined,
): boolean {
  if (persisted == null) {
    return false;
  }

  if (!hasIndustrySectionDefaults(industry)) {
    return persisted.length > 0;
  }

  if (!persisted.length) {
    return false;
  }

  const defaults = industryDefaultsToWorkspaceSections(industry);
  return !sectionsEqual(persisted, defaults);
}

export function computeAiReadinessScore(input: {
  industry: WorkspaceIndustry;
  industryOtherText: string | null | undefined;
  companyDescription: string | null | undefined;
  estimateSections: WorkspaceEstimateSection[] | null | undefined;
  rules: Array<{ type: WorkspaceRuleType; active?: boolean }>;
}): AiReadinessScore {
  if (!isServiceWorkspace(input.industry)) {
    return {
      percent: 100,
      criteria: [],
    };
  }

  const criteria: AiReadinessCriterion[] = [
    {
      key: "businessType",
      met: hasBusinessTypeConfigured(input.industry, input.industryOtherText),
      weight: CRITERION_WEIGHT,
    },
    {
      key: "companyDescription",
      met: hasCompanyDescriptionConfigured(input.companyDescription),
      weight: CRITERION_WEIGHT,
    },
    {
      key: "domainRulesOrRichDescription",
      met: hasDomainRulesOrRichDescription({
        companyDescription: input.companyDescription,
        rules: input.rules,
      }),
      weight: CRITERION_WEIGHT,
    },
    {
      key: "customSections",
      met: hasCustomEstimateSections(input.industry, input.estimateSections),
      weight: CRITERION_WEIGHT,
    },
  ];

  const percent = criteria.reduce(
    (sum, criterion) => sum + (criterion.met ? criterion.weight : 0),
    0,
  );

  return { percent, criteria };
}

/** For admin/debug: human-readable section snapshot. */
export function formatEstimateSectionsForLocale(
  sections: WorkspaceEstimateSection[],
  locale: Locale,
): string[] {
  return sections.map(
    (section) =>
      `${resolveEstimateSectionTitle(section, locale)}: ${resolveEstimateSectionRule(section, locale)}`,
  );
}
