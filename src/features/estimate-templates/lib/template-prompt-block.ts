import type { TemplateGenerationMode } from "@/features/estimate-templates/lib/template-generation-mode";

export type PromptTemplateItem = {
  name: string;
  unit?: string | null;
  unitPrice?: string | null;
  vatRate?: string | null;
  note?: string | null;
  guidance?: string | null;
};

export type PromptTemplateBlock = {
  name: string;
  currency: string;
  generationMode: TemplateGenerationMode;
  sections: Array<{
    title: string;
    guidance?: string | null;
    items: PromptTemplateItem[];
  }>;
};

export function formatEstimateTemplateBlock(
  template: PromptTemplateBlock | null,
  locale: "pl" | "en" = "pl",
): string {
  if (!template || template.sections.length === 0) {
    return "";
  }

  const isConservative = template.generationMode === "CONSERVATIVE";

  const modeIntro = isConservative
    ? locale === "pl"
      ? [
          "Traktuj ten szablon jako standardową wycenę dla podobnych projektów.",
          "Zachowaj większość pozycji z cenami.",
          "Usuwaj tylko pozycje wyraźnie niepasujące do zakresu prac.",
          "Dodawaj nowe pozycje tylko wtedy, gdy wynikają z opisu klienta.",
        ]
      : [
          "Treat this template as a standard estimate for similar projects.",
          "Keep most items with their listed prices.",
          "Remove only items that clearly do not fit the project scope.",
          "Add new items only when they follow from the client brief.",
        ]
    : locale === "pl"
      ? [
          "Traktuj ten szablon jako bazę usług i cen referencyjnych.",
          "Wybierz tylko pozycje pasujące do zakresu prac.",
          "Nie kopiuj automatycznie całego szablonu.",
          "Dodawaj brakujące pozycje, gdy wynikają z opisu klienta.",
        ]
      : [
          "Treat this template as a catalog of services and reference prices.",
          "Select only items that match the project scope.",
          "Do not copy the entire template automatically.",
          "Add missing items when they follow from the client brief.",
        ];

  const lines: string[] = [
    "## Estimate Template",
    `Template name: ${template.name}`,
    `Currency: ${template.currency}`,
    ...modeIntro,
    "Use template unit prices when you include a matching item.",
    "Do not create empty sections.",
  ];

  template.sections.forEach((section, sectionIndex) => {
    lines.push(`${sectionIndex + 1}. ${section.title}`);
    if (section.guidance?.trim()) {
      lines.push(`   Guidance: ${section.guidance.trim()}`);
    }
    section.items.forEach((item) => {
      const unit = item.unit?.trim() ? ` [unit: ${item.unit.trim()}]` : "";
      const price = item.unitPrice?.trim()
        ? ` [unitPrice: ${item.unitPrice.trim()} ${template.currency}]`
        : "";
      const vat = item.vatRate?.trim() ? ` [vatRate: ${item.vatRate.trim()}]` : "";
      const note = item.note?.trim() ? ` — ${item.note.trim()}` : "";
      const guidance = item.guidance?.trim() ? ` — ${item.guidance.trim()}` : "";
      lines.push(`   - ${item.name}${unit}${price}${vat}${note}${guidance}`);
    });
  });

  return lines.join("\n");
}
