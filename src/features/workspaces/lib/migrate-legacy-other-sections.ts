import type { WorkspaceEstimateSection } from "@/features/workspaces/schemas/estimate-sections";

/** Frozen snapshot of OTHER defaults before OTHER v2 (ai_dynamic). */
export const LEGACY_OTHER_DEFAULT_SECTIONS: WorkspaceEstimateSection[] = [
  {
    key: "scope",
    titlePl: "Zakres",
    titleEn: "Scope",
    rulePl:
      "Opcjonalnie 1–2 krótkie pozycje podsumowujące zakres i wyłączenia (unitPrice może być 0). Wszystkie wyceniane usługi umieszczaj jako osobne pozycje w sekcji Usługi (jednostka, ilość, cena).",
    ruleEn:
      "Optionally 1–2 short line items summarizing scope and exclusions (unitPrice may be 0). Put all priced services as separate line items in the Services section (unit, quantity, price).",
    active: true,
  },
  {
    key: "services",
    titlePl: "Usługi",
    titleEn: "Services",
    rulePl: "Główne usługi z jednostkami (h, szt., pakiet) i realistycznym nakładem.",
    ruleEn: "Core services with units (h, pcs, package) and realistic allowances.",
    active: true,
  },
  {
    key: "add_ons",
    titlePl: "Opcje dodatkowe",
    titleEn: "Add-ons",
    rulePl: "Opcjonalne rozszerzenia, upgrade'y i pakiety poza zakresem podstawowym.",
    ruleEn: "Optional extensions, upgrades, and packages beyond the base scope.",
    active: true,
  },
  {
    key: "notes",
    titlePl: "Uwagi",
    titleEn: "Notes",
    rulePl:
      "Warunki, wyłączenia, rezerwa lub koszty dodatkowe poza głównym zakresem. Przy wyłączeniach nie powtarzaj nazwy wykluczonej usługi w tytule pozycji (np. „Wyłączone z wyceny” zamiast „Catering wyłączony”).",
    ruleEn:
      'Terms, exclusions, contingency, or additional costs outside the main scope. When noting exclusions, do not repeat the excluded service name in the line item title (e.g. "Excluded from estimate" instead of "Catering excluded").',
    active: true,
  },
];

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

export function isLegacyOtherDefaultSections(
  sections: WorkspaceEstimateSection[],
): boolean {
  return sectionsEqual(sections, LEGACY_OTHER_DEFAULT_SECTIONS);
}
