import type {
  BusinessDocumentType,
  IndustryFieldValueType,
  Prisma,
  WorkspaceIndustry,
  WorkspaceLocale,
} from "@prisma/client";

import { prisma } from "@/db/client";
import type { CreateFieldDefinitionInput, UpdateFieldDefinitionInput } from "@/features/industry-fields/schemas/definition";
import { mapInputToTypedColumns, type FieldValueInput } from "@/features/industry-fields/server/map-field-value";

export async function listFieldDefinitions(input: {
  industry: WorkspaceIndustry;
  documentType: BusinessDocumentType;
}) {
  return prisma.industryFieldDefinition.findMany({
    where: {
      industry: input.industry,
      documentType: input.documentType,
    },
    include: {
      translations: {
        orderBy: { locale: "asc" },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
  });
}

export async function listActiveFieldDefinitions(input: {
  industry: WorkspaceIndustry;
  documentType: BusinessDocumentType;
}) {
  return prisma.industryFieldDefinition.findMany({
    where: {
      industry: input.industry,
      documentType: input.documentType,
      active: true,
    },
    include: {
      translations: true,
    },
    orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
  });
}

export async function findFieldDefinitionById(id: string) {
  return prisma.industryFieldDefinition.findUnique({
    where: { id },
    include: { translations: true },
  });
}

export async function createFieldDefinitionRecord(input: CreateFieldDefinitionInput) {
  return prisma.$transaction(async (tx) => {
    const field = await tx.industryFieldDefinition.create({
      data: {
        industry: input.industry,
        documentType: input.documentType,
        key: input.key,
        valueType: input.valueType,
        sortOrder: input.sortOrder,
        required: input.required,
        active: input.active,
        options: input.options ?? undefined,
        translations: {
          create: input.translations.map((translation) => ({
            locale: translation.locale,
            label: translation.label,
            description: translation.description ?? undefined,
            placeholder: translation.placeholder ?? undefined,
          })),
        },
      },
      include: { translations: true },
    });

    return field;
  });
}

export async function updateFieldDefinitionRecord(input: UpdateFieldDefinitionInput) {
  return prisma.$transaction(async (tx) => {
    const data: Prisma.IndustryFieldDefinitionUpdateInput = {};

    if (input.sortOrder !== undefined) {
      data.sortOrder = input.sortOrder;
    }

    if (input.required !== undefined) {
      data.required = input.required;
    }

    if (input.active !== undefined) {
      data.active = input.active;
    }

    if (input.options !== undefined) {
      data.options = input.options ?? undefined;
    }

    const field = await tx.industryFieldDefinition.update({
      where: { id: input.id },
      data,
      include: { translations: true },
    });

    if (input.translations?.length) {
      for (const translation of input.translations) {
        await tx.industryFieldTranslation.upsert({
          where: {
            fieldId_locale: {
              fieldId: input.id,
              locale: translation.locale,
            },
          },
          create: {
            fieldId: input.id,
            locale: translation.locale,
            label: translation.label,
            description: translation.description ?? undefined,
            placeholder: translation.placeholder ?? undefined,
          },
          update: {
            label: translation.label,
            description: translation.description ?? undefined,
            placeholder: translation.placeholder ?? undefined,
          },
        });
      }
    }

    return tx.industryFieldDefinition.findUniqueOrThrow({
      where: { id: input.id },
      include: { translations: true },
    });
  });
}

export async function listDocumentFieldValues(input: {
  workspaceId: string;
  documentType: BusinessDocumentType;
  documentId: string;
}) {
  return prisma.documentFieldValue.findMany({
    where: {
      workspaceId: input.workspaceId,
      documentType: input.documentType,
      documentId: input.documentId,
    },
    orderBy: { fieldKey: "asc" },
  });
}

export async function upsertDocumentFieldValuesRecord(input: {
  workspaceId: string;
  documentType: BusinessDocumentType;
  documentId: string;
  values: Array<{
    fieldKey: string;
    valueType: IndustryFieldValueType;
    value: FieldValueInput;
  }>;
}) {
  return prisma.$transaction(
    input.values.map((entry) => {
      const columns = mapInputToTypedColumns(entry.valueType, entry.value);

      return prisma.documentFieldValue.upsert({
        where: {
          documentType_documentId_fieldKey: {
            documentType: input.documentType,
            documentId: input.documentId,
            fieldKey: entry.fieldKey,
          },
        },
        create: {
          workspaceId: input.workspaceId,
          documentType: input.documentType,
          documentId: input.documentId,
          fieldKey: entry.fieldKey,
          ...columns,
        },
        update: columns,
      });
    }),
  );
}

export function pickTranslation<T extends { locale: WorkspaceLocale }>(
  translations: T[],
  locale: WorkspaceLocale,
): T | undefined {
  return translations.find((translation) => translation.locale === locale);
}
