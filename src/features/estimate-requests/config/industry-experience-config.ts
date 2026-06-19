import { WorkspaceIndustry } from "@prisma/client";

import { isServiceWorkspace } from "@/features/workspaces/lib/industries";
import type { Locale } from "@/lib/locale";

export type IndustryExperienceSegment = "construction" | "services";

export type CarpentryBudgetTier =
  | "economy"
  | "standard"
  | "premium"
  | "luxury";

export const CARPENTRY_BUDGET_TIERS: CarpentryBudgetTier[] = [
  "economy",
  "standard",
  "premium",
  "luxury",
];

export const DEFAULT_CARPENTRY_BUDGET_TIER: CarpentryBudgetTier = "standard";

export type DocumentTerminology = {
  documentSingular: string;
  documentPlural: string;
  documentEyebrow: string;
  itemsSection: string;
};

export type IndustryFormLabelKeys = {
  description: string;
  descriptionPlaceholder: string;
  preferredDate: string;
  serviceLocation: string;
  serviceLocationPlaceholder: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  voivodeship: string;
};

export type IndustryBriefLabelKeys = {
  projectDescription: string;
  preferredStart: string;
  serviceLocation: string;
  address: string;
  street: string;
  city: string;
  postalCode: string;
  voivodeship: string;
};

export type IndustryExperienceConfig = {
  segment: IndustryExperienceSegment;
  form: {
    showConstructionAddress: boolean;
    showServiceLocation: boolean;
    showIndustryCatalogFields: boolean;
    showPreferredDate: boolean;
    labelKeys: IndustryFormLabelKeys;
  };
  voice: {
    missingFieldKeys: string[];
    ignoredExtractionKeys: string[];
    checklistLabelKeys: string[];
  };
  brief: IndustryBriefLabelKeys;
  terminology: Record<Locale, DocumentTerminology>;
};

export const SERVICE_ESTIMATION_PRINCIPLES: Record<Locale, string[]> = {
  pl: [
    "Każda pozycja z uzasadnioną jednostką i ilością.",
    "Ceny netto PLN; vatRate według reguł workspace.",
    "Rozdziel usługi główne od opcji dodatkowych zgodnie ze strukturą sekcji.",
    "Rozbij zakres na pozycje kosztorysowe; nie zamieniaj briefu w jedno pole opisowe.",
    "Nie zakładaj usług ani kosztów, które nie wynikają z briefu, Company Context, Workspace Rules lub standardowej praktyki branżowej.",
  ],
  en: [
    "Every line has a justified unit and quantity.",
    "Net PLN prices; vatRate per workspace rules.",
    "Split core services from add-ons according to the section structure.",
    "Break scope into priced line items; do not collapse the brief into a single descriptive row.",
    "Do not assume services or costs that are not supported by the brief, Company Context, Workspace Rules, or standard trade practice.",
  ],
};

const CONSTRUCTION_CONFIG: IndustryExperienceConfig = {
  segment: "construction",
  form: {
    showConstructionAddress: true,
    showServiceLocation: false,
    showIndustryCatalogFields: true,
    showPreferredDate: true,
    labelKeys: {
      description: "form.fields.description",
      descriptionPlaceholder: "form.placeholders.description",
      preferredDate: "form.fields.preferredStartDate",
      serviceLocation: "form.fields.serviceLocation",
      serviceLocationPlaceholder: "form.placeholders.serviceLocation",
      streetAddress: "form.fields.streetAddress",
      city: "form.fields.city",
      postalCode: "form.fields.postalCode",
      voivodeship: "form.fields.voivodeship",
    },
  },
  voice: {
    missingFieldKeys: [
      "propertyType",
      "city",
      "area",
      "preferredStartDate",
      "scopeOfWork",
      "contact",
    ],
    ignoredExtractionKeys: [],
    checklistLabelKeys: [
      "propertyType",
      "location",
      "scope",
      "timeline",
      "documents",
    ],
  },
  brief: {
    projectDescription: "projectDescription",
    preferredStart: "preferredStart",
    serviceLocation: "serviceLocation",
    address: "address",
    street: "street",
    city: "city",
    postalCode: "postalCode",
    voivodeship: "voivodeship",
  },
  terminology: {
    pl: {
      documentSingular: "Kosztorys",
      documentPlural: "Kosztorysy",
      documentEyebrow: "Kosztorys",
      itemsSection: "Kosztorys",
    },
    en: {
      documentSingular: "Estimate",
      documentPlural: "Estimates",
      documentEyebrow: "Estimate",
      itemsSection: "Estimate",
    },
  },
};

const SERVICES_CONFIG: IndustryExperienceConfig = {
  segment: "services",
  form: {
    showConstructionAddress: false,
    showServiceLocation: true,
    showIndustryCatalogFields: false,
    showPreferredDate: true,
    labelKeys: {
      description: "form.byIndustry.services.fields.description",
      descriptionPlaceholder: "form.byIndustry.services.placeholders.description",
      preferredDate: "form.byIndustry.services.fields.preferredDate",
      serviceLocation: "form.byIndustry.services.fields.serviceLocation",
      serviceLocationPlaceholder: "form.byIndustry.services.placeholders.serviceLocation",
      streetAddress: "form.fields.streetAddress",
      city: "form.fields.city",
      postalCode: "form.fields.postalCode",
      voivodeship: "form.fields.voivodeship",
    },
  },
  voice: {
    missingFieldKeys: [
      "description",
      "serviceLocation",
      "preferredStartDate",
      "scopeOfWork",
      "contact",
    ],
    ignoredExtractionKeys: ["propertyType", "area"],
    checklistLabelKeys: [
      "serviceDescription",
      "scope",
      "serviceLocation",
      "timeline",
      "contact",
    ],
  },
  brief: {
    projectDescription: "serviceDescription",
    preferredStart: "preferredRealizationDate",
    serviceLocation: "serviceLocation",
    address: "address",
    street: "street",
    city: "city",
    postalCode: "postalCode",
    voivodeship: "voivodeship",
  },
  terminology: {
    pl: {
      documentSingular: "Wycena",
      documentPlural: "Wyceny",
      documentEyebrow: "Wycena",
      itemsSection: "Wycena",
    },
    en: {
      documentSingular: "Quote",
      documentPlural: "Quotes",
      documentEyebrow: "Quote",
      itemsSection: "Quote",
    },
  },
};

const CARPENTRY_CONFIG: IndustryExperienceConfig = {
  ...CONSTRUCTION_CONFIG,
  voice: {
    missingFieldKeys: [
      "city",
      "preferredStartDate",
      "scopeOfWork",
      "contact",
    ],
    ignoredExtractionKeys: ["propertyType", "area", "budgetTier"],
    checklistLabelKeys: [
      "productCategories",
      "projectType",
      "scope",
      "timeline",
      "contact",
    ],
  },
};

const ELECTRICAL_CONFIG: IndustryExperienceConfig = {
  ...CONSTRUCTION_CONFIG,
  voice: {
    missingFieldKeys: [
      "city",
      "preferredStartDate",
      "scopeOfWork",
      "contact",
    ],
    ignoredExtractionKeys: ["propertyType", "area"],
    checklistLabelKeys: [
      "buildingType",
      "scope",
      "timeline",
      "contact",
    ],
  },
};

export function getIndustryExperienceSegment(
  industry: WorkspaceIndustry,
): IndustryExperienceSegment {
  return isServiceWorkspace(industry) ? "services" : "construction";
}

export function getIndustryExperienceConfig(
  industry: WorkspaceIndustry,
): IndustryExperienceConfig {
  if (isServiceWorkspace(industry)) {
    return SERVICES_CONFIG;
  }
  if (industry === WorkspaceIndustry.CARPENTRY) {
    return CARPENTRY_CONFIG;
  }
  if (industry === WorkspaceIndustry.ELECTRICAL) {
    return ELECTRICAL_CONFIG;
  }
  return CONSTRUCTION_CONFIG;
}

export function getDocumentTerminology(
  industry: WorkspaceIndustry,
  locale: Locale,
): DocumentTerminology {
  return getIndustryExperienceConfig(industry).terminology[locale];
}
