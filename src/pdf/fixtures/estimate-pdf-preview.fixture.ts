import { WorkspaceIndustry } from "@prisma/client";

import { buildEstimatePdfViewModel, type EstimatePdfViewModel } from "@/pdf/lib/build-pdf-view-model";
import type { Locale } from "@/lib/locale";

/** Simple placeholder logo (blue cube) for admin HTML preview. */
const PLACEHOLDER_LOGO_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath fill='%232563eb' d='M24 4 6 14v20l18 10 18-10V14Z'/%3E%3Cpath fill='%233b82f6' d='M24 4v20l18-10V14Z'/%3E%3Cpath fill='%231d4ed8' d='M24 24 6 34V14l18 10Z'/%3E%3C/svg%3E";

export type EstimatePdfPreviewFixtureOptions = {
  locale?: Locale;
  showWatermark?: boolean;
  primaryColor?: string;
  accentColor?: string;
};

type PreviewLineItemInput = {
  pl: string;
  en: string;
  unitPl: string;
  unitEn: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
};

type PreviewSectionInput = {
  titlePl: string;
  titleEn: string;
  sortOrder: number;
  items: PreviewLineItemInput[];
};

function buildPreviewSections(locale: Locale) {
  const isPl = locale === "pl";

  const sections: PreviewSectionInput[] = [
    {
      titlePl: "Prace rozbiórkowe",
      titleEn: "Demolition",
      sortOrder: 0,
      items: [
        {
          pl: "Demontaż starych drzwi wewnętrznych wraz z ościeżnicami",
          en: "Removal of existing interior doors including frames",
          unitPl: "szt.",
          unitEn: "pcs",
          quantity: 4,
          unitPrice: 180,
          sortOrder: 0,
        },
        {
          pl: "Skuwanie płytek ściennych i podłogowych w łazience",
          en: "Removal of wall and floor tiles in bathroom",
          unitPl: "m²",
          unitEn: "m²",
          quantity: 18,
          unitPrice: 55,
          sortOrder: 1,
        },
        {
          pl: "Wyburzenie ścianki działowej GK (ok. 4 m²) z wywozem gruzu",
          en: "Demolition of plasterboard partition (approx. 4 m²) including debris removal",
          unitPl: "m²",
          unitEn: "m²",
          quantity: 4,
          unitPrice: 220,
          sortOrder: 2,
        },
        {
          pl: "Demontaż starej zabudowy kuchennej i blatów",
          en: "Removal of old kitchen cabinetry and countertops",
          unitPl: "kpl.",
          unitEn: "set",
          quantity: 1,
          unitPrice: 950,
          sortOrder: 3,
        },
        {
          pl: "Zabezpieczenie pozostałych pomieszczeń folią i taśmą",
          en: "Protection of remaining rooms with foil and tape",
          unitPl: "m²",
          unitEn: "m²",
          quantity: 45,
          unitPrice: 12,
          sortOrder: 4,
        },
      ],
    },
    {
      titlePl: "Instalacje",
      titleEn: "Installations",
      sortOrder: 1,
      items: [
        {
          pl: "Montaż dodatkowych punktów elektrycznych (gniazda, włączniki, oświetlenie)",
          en: "Installation of additional electrical points (sockets, switches, lighting)",
          unitPl: "pkt.",
          unitEn: "pcs",
          quantity: 12,
          unitPrice: 135,
          sortOrder: 0,
        },
        {
          pl: "Wymiana rozdzielnicy elektrycznej 1×12 modułów",
          en: "Replacement of 1×12 module electrical panel",
          unitPl: "kpl.",
          unitEn: "set",
          quantity: 1,
          unitPrice: 2850,
          sortOrder: 1,
        },
        {
          pl: "Prowadzenie obwodów oświetleniowych LED w salonie i korytarzu",
          en: "LED lighting circuit routing in living room and hallway",
          unitPl: "mb",
          unitEn: "lm",
          quantity: 28,
          unitPrice: 48,
          sortOrder: 2,
        },
        {
          pl: "Przeniesienie punktów wod-kan. pod umywalkę i prysznic",
          en: "Relocation of plumbing points for washbasin and shower",
          unitPl: "pkt.",
          unitEn: "pcs",
          quantity: 4,
          unitPrice: 420,
          sortOrder: 3,
        },
        {
          pl: "Montaż odpływu liniowego i spadków w strefie prysznica",
          en: "Linear drain installation and shower area falls",
          unitPl: "kpl.",
          unitEn: "set",
          quantity: 1,
          unitPrice: 1680,
          sortOrder: 4,
        },
        {
          pl: "Instalacja rekuperacji — przyłączenie i kanały w łazience",
          en: "MVHR unit connection and ducting in bathroom zone",
          unitPl: "kpl.",
          unitEn: "set",
          quantity: 1,
          unitPrice: 2400,
          sortOrder: 5,
        },
        {
          pl: "Pomiary elektryczne i protokół odbioru instalacji",
          en: "Electrical testing and installation handover report",
          unitPl: "kpl.",
          unitEn: "set",
          quantity: 1,
          unitPrice: 650,
          sortOrder: 6,
        },
      ],
    },
    {
      titlePl: "Prace wykończeniowe",
      titleEn: "Finishing works",
      sortOrder: 2,
      items: [
        {
          pl: "Tynki maszynowe na ścianach i suficie (warstwa wyrównawcza)",
          en: "Machine plaster on walls and ceiling (levelling coat)",
          unitPl: "m²",
          unitEn: "m²",
          quantity: 95,
          unitPrice: 38,
          sortOrder: 0,
        },
        {
          pl: "Gładzie gipsowe ścian i sufitów (2 warstwy, szlif)",
          en: "Gypsum skim coats on walls and ceilings (2 coats, sanding)",
          unitPl: "m²",
          unitEn: "m²",
          quantity: 95,
          unitPrice: 42,
          sortOrder: 1,
        },
        {
          pl: "Malowanie ścian i sufitów farbą lateksową (2 warstwy)",
          en: "Latex paint on walls and ceilings (2 coats)",
          unitPl: "m²",
          unitEn: "m²",
          quantity: 95,
          unitPrice: 22,
          sortOrder: 2,
        },
        {
          pl: "Układanie paneli podłogowych laminowanych w salonie i sypialni",
          en: "Laminate flooring in living room and bedroom",
          unitPl: "m²",
          unitEn: "m²",
          quantity: 42,
          unitPrice: 68,
          sortOrder: 3,
        },
        {
          pl: "Montaż listew przypodłogowych MDF (malowane)",
          en: "MDF skirting boards installation (painted)",
          unitPl: "mb",
          unitEn: "lm",
          quantity: 38,
          unitPrice: 28,
          sortOrder: 4,
        },
        {
          pl: "Wykonanie posadzki epoksydowej w wiatrołapie",
          en: "Epoxy floor finish in entryway",
          unitPl: "m²",
          unitEn: "m²",
          quantity: 6,
          unitPrice: 185,
          sortOrder: 5,
        },
      ],
    },
    {
      titlePl: "Kuchnia",
      titleEn: "Kitchen",
      sortOrder: 3,
      items: [
        {
          pl: "Zabudowa kuchenna na wymiar (fronty lakierowane, soft-close)",
          en: "Custom kitchen cabinetry (lacquered fronts, soft-close)",
          unitPl: "mb",
          unitEn: "lm",
          quantity: 4.2,
          unitPrice: 3200,
          sortOrder: 0,
        },
        {
          pl: "Blat kompozytowy z montażem i wycięciem pod zlew",
          en: "Composite countertop with sink cut-out and installation",
          unitPl: "mb",
          unitEn: "lm",
          quantity: 3.6,
          unitPrice: 1450,
          sortOrder: 1,
        },
        {
          pl: "Montaż zlewu granitowego i baterii kuchennej",
          en: "Granite sink and kitchen faucet installation",
          unitPl: "kpl.",
          unitEn: "set",
          quantity: 1,
          unitPrice: 480,
          sortOrder: 2,
        },
        {
          pl: "Okap podszafkowy z odprowadzeniem powietrza",
          en: "Under-cabinet hood with ducted ventilation",
          unitPl: "kpl.",
          unitEn: "set",
          quantity: 1,
          unitPrice: 890,
          sortOrder: 3,
        },
        {
          pl: "Płytki ścienne nad blatem (metro 10×20, fuga 2 mm)",
          en: "Wall tiling above countertop (metro 10×20, 2 mm grout)",
          unitPl: "m²",
          unitEn: "m²",
          quantity: 4.5,
          unitPrice: 165,
          sortOrder: 4,
        },
        {
          pl: "Podłączenie płyty indukcyjnej, zmywarki i lodówki",
          en: "Connection of induction hob, dishwasher, and fridge",
          unitPl: "kpl.",
          unitEn: "set",
          quantity: 1,
          unitPrice: 720,
          sortOrder: 5,
        },
      ],
    },
    {
      titlePl: "Łazienka",
      titleEn: "Bathroom",
      sortOrder: 4,
      items: [
        {
          pl: "Hydroizolacja pod płytki w strefie mokrej (folia w płynie, 2 warstwy)",
          en: "Waterproofing under tiles in wet zone (liquid membrane, 2 coats)",
          unitPl: "m²",
          unitEn: "m²",
          quantity: 14,
          unitPrice: 78,
          sortOrder: 0,
        },
        {
          pl: "Układanie płytek podłogowych antypoślizgowych",
          en: "Anti-slip floor tile installation",
          unitPl: "m²",
          unitEn: "m²",
          quantity: 6.5,
          unitPrice: 145,
          sortOrder: 1,
        },
        {
          pl: "Układanie płytek ściennych w strefie prysznica (do sufitu)",
          en: "Wall tiling in shower area (floor to ceiling)",
          unitPl: "m²",
          unitEn: "m²",
          quantity: 11,
          unitPrice: 155,
          sortOrder: 2,
        },
        {
          pl: "Montaż kabiny walk-in ze szkłem hartowanym 8 mm",
          en: "Walk-in shower with 8 mm tempered glass",
          unitPl: "kpl.",
          unitEn: "set",
          quantity: 1,
          unitPrice: 4200,
          sortOrder: 3,
        },
        {
          pl: "Montaż miski WC podwieszanej z przyciskiem podtynkowym",
          en: "Wall-hung WC with concealed cistern frame",
          unitPl: "kpl.",
          unitEn: "set",
          quantity: 1,
          unitPrice: 1980,
          sortOrder: 4,
        },
        {
          pl: "Montaż umywalki nablatowej z szafką i armatury",
          en: "Countertop washbasin with vanity unit and fixtures",
          unitPl: "kpl.",
          unitEn: "set",
          quantity: 1,
          unitPrice: 1650,
          sortOrder: 5,
        },
        {
          pl: "Grzejnik drabinkowy z podłączeniem i termostatem",
          en: "Ladder towel radiator with connection and thermostat",
          unitPl: "kpl.",
          unitEn: "set",
          quantity: 1,
          unitPrice: 980,
          sortOrder: 6,
        },
      ],
    },
    {
      titlePl: "Montaż wyposażenia",
      titleEn: "Fixtures installation",
      sortOrder: 5,
      items: [
        {
          pl: "Montaż drzwi wewnętrznych antracytowych (4 skrzydła + ościeżnice)",
          en: "Interior anthracite doors (4 leaves + frames)",
          unitPl: "szt.",
          unitEn: "pcs",
          quantity: 4,
          unitPrice: 520,
          sortOrder: 0,
        },
        {
          pl: "Montaż karniszy sufitowych w salonie i sypialni",
          en: "Ceiling curtain rods in living room and bedroom",
          unitPl: "mb",
          unitEn: "lm",
          quantity: 9,
          unitPrice: 85,
          sortOrder: 1,
        },
        {
          pl: "Montaż opraw oświetleniowych sufitowych i kinkietów",
          en: "Ceiling fixtures and wall sconces installation",
          unitPl: "szt.",
          unitEn: "pcs",
          quantity: 14,
          unitPrice: 65,
          sortOrder: 2,
        },
        {
          pl: "Montaż rolety zewnętrznej elektrycznej w salonie",
          en: "Electric external roller shutter in living room",
          unitPl: "kpl.",
          unitEn: "set",
          quantity: 1,
          unitPrice: 3100,
          sortOrder: 3,
        },
        {
          pl: "Sprzątanie pobudowlane i wywóz resztek materiałów",
          en: "Post-construction cleaning and leftover material removal",
          unitPl: "m²",
          unitEn: "m²",
          quantity: 70,
          unitPrice: 18,
          sortOrder: 4,
        },
      ],
    },
  ];

  return sections.map((section) => ({
    title: isPl ? section.titlePl : section.titleEn,
    sortOrder: section.sortOrder,
    lineItems: section.items.map((item) => ({
      name: isPl ? item.pl : item.en,
      unit: isPl ? item.unitPl : item.unitEn,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      vatRate: 0.23,
      sortOrder: item.sortOrder,
    })),
  }));
}

export function createEstimatePdfPreviewFixture(
  options: EstimatePdfPreviewFixtureOptions = {},
): EstimatePdfViewModel {
  const locale = options.locale ?? "pl";

  const model = buildEstimatePdfViewModel({
    locale,
    currency: "PLN",
    requestNumber: "ER-2026-00013",
    estimateId: "preview-estimate",
    customerData: {
      fullName: "Marek Janusz",
      email: "marek.janusz@example.com",
      phone: "+48 600 100 200",
    },
    requestAddress: {
      streetAddress: "ul. Polna 12/4",
      city: "Poznań",
      postalCode: "60-101",
      voivodeship: "wielkopolskie",
    },
    propertyTypeLabel: locale === "pl" ? "Mieszkanie" : "Apartment",
    floorArea: 70,
    workspaceIndustry: WorkspaceIndustry.CONSTRUCTION,
    workspace: {
      name: locale === "pl" ? "PHU Remonty" : "Renovation Co.",
      settings: {
        companyAddress: "ul. Budowlana 8, 60-200 Poznań",
        companyTaxId: "1234567890",
        companyEmail: "biuro@phuremonty.pl",
        companyPhone: "+48 61 200 30 40",
        branding: {
          primaryColor: options.primaryColor ?? "#2563eb",
          accentColor: options.accentColor ?? "#dbeafe",
        },
      },
    },
    brandingPrimaryColor: options.primaryColor ?? "#2563eb",
    brandingAccentColor: options.accentColor ?? "#dbeafe",
    versionNumber: 1,
    marginPercent: 0,
    sections: buildPreviewSections(locale),
    userPlan: options.showWatermark ? "FREE" : "PRO",
    issueDate: new Date("2026-06-09"),
  });

  return {
    ...model,
    showWatermark: options.showWatermark ?? false,
    logoDataUri: PLACEHOLDER_LOGO_DATA_URI,
    logoUrl: null,
    logoStorageKey: null,
    primaryColor: options.primaryColor ?? model.primaryColor,
    accentColor: options.accentColor ?? model.accentColor,
  };
}
