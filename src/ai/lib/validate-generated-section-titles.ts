import {
  isMetaSectionTitle,
  isNarrativeSectionTitle,
} from "@/features/workspaces/lib/commercial-section";

export type SectionTitleWarningCode =
  | "unknown_section_title"
  | "extra_section"
  | "missing_expected_section"
  | "narrative_section_title"
  | "meta_section_title";

export type SectionTitleWarning = {
  code: SectionTitleWarningCode;
  generatedTitle?: string;
  suggestedTitle?: string;
};

export type SectionTitleValidationResult = {
  ok: boolean;
  warnings: SectionTitleWarning[];
  allowedTitles: string[];
  generatedTitles: string[];
};

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

export function validateGeneratedSectionTitles(input: {
  generatedSections: Array<{ title: string; items?: unknown[] }>;
  allowedSections: Array<{ title: string; key?: string }>;
  dynamicSectionStructure?: boolean;
}): SectionTitleValidationResult {
  const allowedTitles = input.allowedSections.map((s) => s.title);
  const dynamicStructure =
    input.dynamicSectionStructure ?? allowedTitles.length === 0;
  const allowedNormalized = new Map(
    allowedTitles.map((title) => [normalizeTitle(title), title]),
  );

  const generatedTitles = input.generatedSections.map((s) => s.title.trim());
  const warnings: SectionTitleWarning[] = [];

  if (!dynamicStructure) {
    for (const title of generatedTitles) {
      if (!title) {
        continue;
      }
      if (!allowedNormalized.has(normalizeTitle(title))) {
        warnings.push({
          code: "unknown_section_title",
          generatedTitle: title,
        });
      }
    }

    const generatedNormalized = new Set(
      generatedTitles.filter(Boolean).map(normalizeTitle),
    );

    for (const allowed of allowedTitles) {
      if (!generatedNormalized.has(normalizeTitle(allowed))) {
        warnings.push({
          code: "missing_expected_section",
          suggestedTitle: allowed,
        });
      }
    }
  }

  for (const title of generatedTitles) {
    if (!title) {
      continue;
    }
    if (isNarrativeSectionTitle(title)) {
      warnings.push({
        code: "narrative_section_title",
        generatedTitle: title,
      });
    } else if (isMetaSectionTitle(title)) {
      warnings.push({
        code: "meta_section_title",
        generatedTitle: title,
      });
    }
  }

  const totalLineItems = input.generatedSections.reduce(
    (sum, section) => sum + (section.items?.length ?? 0),
    0,
  );

  const hardFailure =
    input.generatedSections.length === 0 || totalLineItems === 0;

  return {
    ok: !hardFailure,
    warnings,
    allowedTitles,
    generatedTitles,
  };
}
