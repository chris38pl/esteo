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

/** Built-in platform catalog — versioned in repo, safe to re-run (upsert). */
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

  return { created, updated, total: INDUSTRY_FIELD_CATALOG.length };
}

/** @deprecated Use seedIndustryFieldCatalog — kept for prisma/seed.ts */
export async function seedConstructionEstimateRequestFields(prisma: PrismaClient) {
  await seedIndustryFieldCatalog(prisma);
}
