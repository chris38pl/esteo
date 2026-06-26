import type { WorkspaceIndustry } from "@prisma/client";

import type { EstimateTemplateInput } from "@/features/estimate-templates/schemas/estimate-template";
import { isServiceWorkspace } from "@/features/workspaces/lib/industries";

export type SystemEstimateTemplate = EstimateTemplateInput & {
  key: string;
  industry: WorkspaceIndustry;
};

const DEFAULT_TEMPLATE_META = {
  generationMode: "SMART" as const,
  currency: "PLN",
};

export const SYSTEM_ESTIMATE_TEMPLATES: SystemEstimateTemplate[] = [
  {
    key: "construction-renovation",
    industry: "CONSTRUCTION",
    name: "Remont mieszkania",
    description: "Przykładowa struktura dla remontów mieszkań i lokali.",
    ...DEFAULT_TEMPLATE_META,
    sections: [
      {
        title: "Prace przygotowawcze",
        guidance: "Uwzględnij zabezpieczenie, demontaż i przygotowanie frontu robót, jeśli pasują do zakresu.",
        items: [
          { name: "Zabezpieczenie pomieszczeń", unit: "kpl", unitPrice: "350" },
          { name: "Demontaż istniejących elementów", unit: "kpl", unitPrice: "480" },
        ],
      },
      {
        title: "Ściany i sufity",
        items: [
          { name: "Szpachlowanie", unit: "m²", unitPrice: "45" },
          { name: "Malowanie ścian i sufitów", unit: "m²", unitPrice: "28" },
        ],
      },
      {
        title: "Podłogi",
        items: [
          { name: "Demontaż starej podłogi", unit: "m²", unitPrice: "35" },
          { name: "Montaż nowej podłogi", unit: "m²", unitPrice: "95" },
        ],
      },
    ],
  },
  {
    key: "plumbing-bathroom",
    industry: "PLUMBING",
    name: "Remont łazienki",
    description: "Przykładowa struktura dla łazienek i prac hydraulicznych.",
    ...DEFAULT_TEMPLATE_META,
    sections: [
      {
        title: "Demontaż",
        items: [
          { name: "Demontaż armatury", unit: "kpl", unitPrice: "320" },
          { name: "Demontaż płytek", unit: "m²", unitPrice: "55" },
        ],
      },
      {
        title: "Hydraulika",
        items: [
          { name: "Montaż WC", unit: "szt", unitPrice: "450" },
          { name: "Montaż umywalki", unit: "szt", unitPrice: "280" },
          { name: "Montaż baterii", unit: "szt", unitPrice: "180" },
        ],
      },
      {
        title: "Wykończenie",
        items: [{ name: "Układanie płytek", unit: "m²", unitPrice: "180" }],
      },
    ],
  },
  {
    key: "electrical-apartment",
    industry: "ELECTRICAL",
    name: "Instalacja w mieszkaniu",
    description: "Przykładowa struktura dla prac elektrycznych w mieszkaniach.",
    ...DEFAULT_TEMPLATE_META,
    sections: [
      {
        title: "Punkty elektryczne",
        items: [
          { name: "Montaż gniazda", unit: "szt", unitPrice: "85" },
          { name: "Montaż punktu oświetleniowego", unit: "szt", unitPrice: "120" },
        ],
      },
      {
        title: "Rozdzielnia i zabezpieczenia",
        items: [
          { name: "Modernizacja rozdzielnicy", unit: "kpl", unitPrice: "1200" },
          { name: "Pomiary elektryczne", unit: "kpl", unitPrice: "350" },
        ],
      },
    ],
  },
  {
    key: "carpentry-built-ins",
    industry: "CARPENTRY",
    name: "Zabudowa na wymiar",
    description: "Przykładowa struktura dla mebli i zabudów na wymiar.",
    ...DEFAULT_TEMPLATE_META,
    sections: [
      {
        title: "Projekt i pomiar",
        items: [
          { name: "Pomiar i konsultacja", unit: "kpl", unitPrice: "250" },
          { name: "Projekt techniczny", unit: "kpl", unitPrice: "600" },
        ],
      },
      {
        title: "Produkcja",
        items: [
          { name: "Korpusy meblowe", unit: "m²", unitPrice: "420" },
          { name: "Fronty meblowe", unit: "m²", unitPrice: "380" },
        ],
      },
      {
        title: "Montaż",
        items: [{ name: "Montaż zabudowy", unit: "kpl", unitPrice: "900" }],
      },
    ],
  },
  {
    key: "services-basic",
    industry: "OTHER",
    name: "Usługi standardowe",
    description: "Uniwersalny szablon dla prostych usług — sekcje definiuje AI lub workspace.",
    ...DEFAULT_TEMPLATE_META,
    sections: [
      {
        title: "Realizacja usługi",
        items: [
          { name: "Realizacja usługi", unit: "kpl", unitPrice: "500" },
          { name: "Przygotowanie i koordynacja", unit: "kpl", unitPrice: "200" },
        ],
      },
    ],
  },
];

export function hasSystemEstimateTemplateForIndustry(industry: WorkspaceIndustry): boolean {
  return !isServiceWorkspace(industry);
}

export function getSystemEstimateTemplateForIndustry(
  industry: WorkspaceIndustry,
): SystemEstimateTemplate {
  return (
    SYSTEM_ESTIMATE_TEMPLATES.find((template) => template.industry === industry) ??
    SYSTEM_ESTIMATE_TEMPLATES.find((template) => template.industry === "OTHER")!
  );
}
