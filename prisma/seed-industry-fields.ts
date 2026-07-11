import {
  BusinessDocumentType,
  IndustryFieldValueType,
  Prisma,
  PrismaClient,
  WorkspaceIndustry,
  WorkspaceLocale,
} from "@prisma/client";

const PROPERTY_TYPE_OPTIONS = [
  { value: "apartment", labelKey: "apartment" },
  { value: "house", labelKey: "house" },
  { value: "office", labelKey: "office" },
  { value: "commercial", labelKey: "commercial" },
  { value: "other", labelKey: "other" },
] as const;

const CARPENTRY_PRODUCT_CATEGORIES = [
  { value: "kitchen", labelKey: "kitchen" },
  { value: "wardrobe", labelKey: "wardrobe" },
  { value: "closet", labelKey: "closet" },
  { value: "bathroom", labelKey: "bathroom" },
  { value: "office", labelKey: "office" },
  { value: "reception", labelKey: "reception" },
  { value: "commercial", labelKey: "commercial" },
  { value: "other", labelKey: "other" },
] as const;

const PROJECT_TYPES_CARPENTRY = [
  { value: "new_build", labelKey: "new_build" },
  { value: "extension", labelKey: "extension" },
  { value: "front_replacement", labelKey: "front_replacement" },
  { value: "renovation", labelKey: "renovation" },
  { value: "service", labelKey: "service" },
  { value: "other", labelKey: "other" },
] as const;

function dropdownSelectOptions(
  choices: readonly { value: string; labelKey: string }[],
  selectMode: "single" | "multi" = "single",
) {
  return {
    selectMode,
    tiles: false,
    choices,
  } as unknown as Prisma.InputJsonValue;
}

const BUDGET_TIER_OPTIONS = [
  { value: "economy", labelKey: "economy" },
  { value: "standard", labelKey: "standard" },
  { value: "premium", labelKey: "premium" },
  { value: "luxury", labelKey: "luxury" },
] as const;

const BUILDING_TYPE_OPTIONS = [
  { value: "house", labelKey: "house" },
  { value: "apartment", labelKey: "apartment" },
  { value: "commercial", labelKey: "commercial" },
  { value: "industrial", labelKey: "industrial" },
  { value: "other", labelKey: "other" },
] as const;

function tileSelectOptions(
  choices: readonly { value: string; labelKey: string }[],
  selectMode: "single" | "multi",
) {
  return {
    selectMode,
    tiles: true,
    choices,
  } as unknown as Prisma.InputJsonValue;
}

type CatalogFieldTranslation = {
  locale: WorkspaceLocale;
  label: string;
  description?: string;
  placeholder?: string;
};

type CatalogFieldDefinition = {
  industry: WorkspaceIndustry;
  documentType: BusinessDocumentType;
  key: string;
  valueType: IndustryFieldValueType;
  sortOrder: number;
  required: boolean;
  options?: Prisma.InputJsonValue;
  translations: CatalogFieldTranslation[];
};

/** Built-in platform catalog - versioned in repo, safe to re-run (upsert). */
export const INDUSTRY_FIELD_CATALOG: CatalogFieldDefinition[] = [
  {
    industry: WorkspaceIndustry.CONSTRUCTION,
    documentType: BusinessDocumentType.ESTIMATE_REQUEST,
    key: "property_type",
    valueType: IndustryFieldValueType.SELECT,
    sortOrder: 0,
    required: true,
    options: PROPERTY_TYPE_OPTIONS,
    translations: [
      {
        locale: WorkspaceLocale.PL,
        label: "Typ nieruchomości",
        placeholder: "Wybierz typ",
      },
      {
        locale: WorkspaceLocale.EN,
        label: "Property type",
        placeholder: "Select type",
      },
    ],
  },
  {
    industry: WorkspaceIndustry.CONSTRUCTION,
    documentType: BusinessDocumentType.ESTIMATE_REQUEST,
    key: "area_size",
    valueType: IndustryFieldValueType.NUMBER,
    sortOrder: 1,
    required: false,
    translations: [
      {
        locale: WorkspaceLocale.PL,
        label: "Powierzchnia (m²)",
        placeholder: "np. 120",
      },
      {
        locale: WorkspaceLocale.EN,
        label: "Area size (m²)",
        placeholder: "e.g. 120",
      },
    ],
  },
  {
    industry: WorkspaceIndustry.CARPENTRY,
    documentType: BusinessDocumentType.ESTIMATE_REQUEST,
    key: "product_categories",
    valueType: IndustryFieldValueType.TEXT,
    sortOrder: 0,
    required: true,
    options: tileSelectOptions(CARPENTRY_PRODUCT_CATEGORIES, "multi"),
    translations: [
      {
        locale: WorkspaceLocale.PL,
        label: "Typ zabudowy",
        placeholder: "Wybierz jedną lub więcej kategorii",
      },
      {
        locale: WorkspaceLocale.EN,
        label: "Fit-out type",
        placeholder: "Select one or more categories",
      },
    ],
  },
  {
    industry: WorkspaceIndustry.CARPENTRY,
    documentType: BusinessDocumentType.ESTIMATE_REQUEST,
    key: "project_types",
    valueType: IndustryFieldValueType.TEXT,
    sortOrder: 1,
    required: true,
    options: dropdownSelectOptions(PROJECT_TYPES_CARPENTRY, "single"),
    translations: [
      {
        locale: WorkspaceLocale.PL,
        label: "Typ realizacji",
        placeholder: "Wybierz typ realizacji",
      },
      {
        locale: WorkspaceLocale.EN,
        label: "Project type",
        placeholder: "Select project type",
      },
    ],
  },
  {
    industry: WorkspaceIndustry.CARPENTRY,
    documentType: BusinessDocumentType.ESTIMATE_REQUEST,
    key: "budget_tier",
    valueType: IndustryFieldValueType.SELECT,
    sortOrder: 2,
    required: false,
    options: BUDGET_TIER_OPTIONS,
    translations: [
      {
        locale: WorkspaceLocale.PL,
        label: "Poziom budżetu",
        placeholder: "Standard (domyślnie)",
      },
      {
        locale: WorkspaceLocale.EN,
        label: "Budget tier",
        placeholder: "Standard (default)",
      },
    ],
  },
  {
    industry: WorkspaceIndustry.ELECTRICAL,
    documentType: BusinessDocumentType.ESTIMATE_REQUEST,
    key: "building_type",
    valueType: IndustryFieldValueType.SELECT,
    sortOrder: 0,
    required: true,
    options: tileSelectOptions(BUILDING_TYPE_OPTIONS, "single"),
    translations: [
      {
        locale: WorkspaceLocale.PL,
        label: "Typ obiektu",
        placeholder: "Wybierz typ obiektu",
      },
      {
        locale: WorkspaceLocale.EN,
        label: "Building type",
        placeholder: "Select building type",
      },
    ],
  },
];

/** Removed from catalog - deactivated on seed so existing DB rows stop appearing in forms. */
const RETIRED_CATALOG_FIELDS: Pick<
  CatalogFieldDefinition,
  "industry" | "documentType" | "key"
>[] = [
  {
    industry: WorkspaceIndustry.ELECTRICAL,
    documentType: BusinessDocumentType.ESTIMATE_REQUEST,
    key: "project_types",
  },
];

export type IndustryFieldCatalogSeedResult = {
  created: number;
  updated: number;
  total: number;
};

export async function seedIndustryFieldCatalog(
  prisma: PrismaClient,
): Promise<IndustryFieldCatalogSeedResult> {
  let created = 0;
  let updated = 0;

  for (const field of INDUSTRY_FIELD_CATALOG) {
    const where = {
      industry_documentType_key: {
        industry: field.industry,
        documentType: field.documentType,
        key: field.key,
      },
    };

    const existing = await prisma.industryFieldDefinition.findUnique({ where });

    const definition = await prisma.industryFieldDefinition.upsert({
      where,
      create: {
        industry: field.industry,
        documentType: field.documentType,
        key: field.key,
        valueType: field.valueType,
        sortOrder: field.sortOrder,
        required: field.required,
        options: field.options ?? Prisma.JsonNull,
        active: true,
        translations: {
          create: field.translations.map((translation) => ({
            locale: translation.locale,
            label: translation.label,
            description: translation.description ?? null,
            placeholder: translation.placeholder ?? null,
          })),
        },
      },
      update: {
        valueType: field.valueType,
        sortOrder: field.sortOrder,
        required: field.required,
        options: field.options ?? Prisma.JsonNull,
        active: true,
      },
    });

    for (const translation of field.translations) {
      await prisma.industryFieldTranslation.upsert({
        where: {
          fieldId_locale: {
            fieldId: definition.id,
            locale: translation.locale,
          },
        },
        create: {
          fieldId: definition.id,
          locale: translation.locale,
          label: translation.label,
          description: translation.description ?? null,
          placeholder: translation.placeholder ?? null,
        },
        update: {
          label: translation.label,
          description: translation.description ?? null,
          placeholder: translation.placeholder ?? null,
        },
      });
    }

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  for (const retired of RETIRED_CATALOG_FIELDS) {
    await prisma.industryFieldDefinition.updateMany({
      where: {
        industry: retired.industry,
        documentType: retired.documentType,
        key: retired.key,
        active: true,
      },
      data: { active: false },
    });
  }

  return { created, updated, total: INDUSTRY_FIELD_CATALOG.length };
}

/** @deprecated Use seedIndustryFieldCatalog - kept for prisma/seed.ts */
export async function seedConstructionEstimateRequestFields(prisma: PrismaClient) {
  await seedIndustryFieldCatalog(prisma);
}
