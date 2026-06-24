import type { WorkspaceIndustry } from "@prisma/client";

import type { EstimateTemplateInput } from "@/features/estimate-templates/schemas/estimate-template";

export type SystemEstimateTemplate = EstimateTemplateInput & {
  key: string;
  industry: WorkspaceIndustry;
};

export const SYSTEM_ESTIMATE_TEMPLATES: SystemEstimateTemplate[] = [
  {
    key: "construction-renovation",
    industry: "CONSTRUCTION",
    name: "Remont mieszkania",
    description: "Przykładowa struktura dla remontów mieszkań i lokali.",
    sections: [
      {
        title: "Prace przygotowawcze",
        guidance: "Uwzględnij zabezpieczenie, demontaż i przygotowanie frontu robót, jeśli pasują do zakresu.",
        items: [
          { name: "Zabezpieczenie pomieszczeń", unit: "kpl" },
          { name: "Demontaż istniejących elementów", unit: "kpl" },
        ],
      },
      {
        title: "Ściany i sufity",
        items: [
          { name: "Szpachlowanie", unit: "m²" },
          { name: "Malowanie ścian i sufitów", unit: "m²" },
        ],
      },
      {
        title: "Podłogi",
        items: [
          { name: "Demontaż starej podłogi", unit: "m²" },
          { name: "Montaż nowej podłogi", unit: "m²" },
        ],
      },
    ],
  },
  {
    key: "plumbing-bathroom",
    industry: "PLUMBING",
    name: "Remont łazienki",
    description: "Przykładowa struktura dla łazienek i prac hydraulicznych.",
    sections: [
      {
        title: "Demontaż",
        items: [
          { name: "Demontaż armatury", unit: "kpl" },
          { name: "Demontaż płytek", unit: "m²" },
        ],
      },
      {
        title: "Hydraulika",
        items: [
          { name: "Montaż WC", unit: "szt" },
          { name: "Montaż umywalki", unit: "szt" },
          { name: "Montaż baterii", unit: "szt" },
        ],
      },
      {
        title: "Wykończenie",
        items: [{ name: "Układanie płytek", unit: "m²" }],
      },
    ],
  },
  {
    key: "electrical-apartment",
    industry: "ELECTRICAL",
    name: "Instalacja w mieszkaniu",
    description: "Przykładowa struktura dla prac elektrycznych w mieszkaniach.",
    sections: [
      {
        title: "Punkty elektryczne",
        items: [
          { name: "Montaż gniazda", unit: "szt" },
          { name: "Montaż punktu oświetleniowego", unit: "szt" },
        ],
      },
      {
        title: "Rozdzielnia i zabezpieczenia",
        items: [
          { name: "Modernizacja rozdzielnicy", unit: "kpl" },
          { name: "Pomiary elektryczne", unit: "kpl" },
        ],
      },
    ],
  },
  {
    key: "carpentry-built-ins",
    industry: "CARPENTRY",
    name: "Zabudowa na wymiar",
    description: "Przykładowa struktura dla mebli i zabudów na wymiar.",
    sections: [
      {
        title: "Projekt i pomiar",
        items: [
          { name: "Pomiar i konsultacja", unit: "kpl" },
          { name: "Projekt techniczny", unit: "kpl" },
        ],
      },
      {
        title: "Produkcja",
        items: [
          { name: "Korpusy meblowe", unit: "m²" },
          { name: "Fronty meblowe", unit: "m²" },
        ],
      },
      {
        title: "Montaż",
        items: [{ name: "Montaż zabudowy", unit: "kpl" }],
      },
    ],
  },
  {
    key: "services-basic",
    industry: "OTHER",
    name: "Usługi standardowe",
    description: "Uniwersalny szablon dla prostych usług.",
    sections: [
      {
        title: "Usługi",
        items: [
          { name: "Realizacja usługi", unit: "kpl" },
          { name: "Przygotowanie i koordynacja", unit: "kpl" },
        ],
      },
      {
        title: "Uwagi",
        guidance: "Dodaj założenia i elementy do potwierdzenia, jeśli opis klienta jest niepełny.",
        items: [],
      },
    ],
  },
];

export function getSystemEstimateTemplateForIndustry(
  industry: WorkspaceIndustry,
): SystemEstimateTemplate {
  return (
    SYSTEM_ESTIMATE_TEMPLATES.find((template) => template.industry === industry) ??
    SYSTEM_ESTIMATE_TEMPLATES.find((template) => template.industry === "OTHER")!
  );
}
