import {
  BusinessDocumentType,
  IndustryFieldValueType,
  PrismaClient,
  WorkspaceIndustry,
  WorkspaceLocale,
} from "@prisma/client";

const PROPERTY_TYPE_OPTIONS = [
  { value: "house", labelKey: "house" },
  { value: "apartment", labelKey: "apartment" },
  { value: "commercial", labelKey: "commercial" },
];

export async function seedConstructionEstimateRequestFields(prisma: PrismaClient) {
  const existing = await prisma.industryFieldDefinition.findFirst({
    where: {
      industry: WorkspaceIndustry.CONSTRUCTION,
      documentType: BusinessDocumentType.ESTIMATE_REQUEST,
      key: "property_type",
    },
  });

  if (existing) {
    return;
  }

  await prisma.industryFieldDefinition.create({
    data: {
      industry: WorkspaceIndustry.CONSTRUCTION,
      documentType: BusinessDocumentType.ESTIMATE_REQUEST,
      key: "property_type",
      valueType: IndustryFieldValueType.SELECT,
      sortOrder: 0,
      required: true,
      options: PROPERTY_TYPE_OPTIONS,
      translations: {
        create: [
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
    },
  });

  await prisma.industryFieldDefinition.create({
    data: {
      industry: WorkspaceIndustry.CONSTRUCTION,
      documentType: BusinessDocumentType.ESTIMATE_REQUEST,
      key: "area_size",
      valueType: IndustryFieldValueType.NUMBER,
      sortOrder: 1,
      required: false,
      translations: {
        create: [
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
    },
  });
}
