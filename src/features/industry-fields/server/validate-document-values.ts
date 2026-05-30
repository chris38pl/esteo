import type { BusinessDocumentType, IndustryFieldValueType } from "@prisma/client";

import type { SelectOption } from "@/features/industry-fields/schemas/definition";
import { listActiveFieldDefinitions } from "@/features/industry-fields/server/repository";
import type { FieldValueInput } from "@/features/industry-fields/server/map-field-value";

export class DocumentFieldValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentFieldValidationError";
  }
}

type Definition = {
  key: string;
  valueType: IndustryFieldValueType;
  required: boolean;
  options: SelectOption[] | null;
};

export async function validateDocumentFieldValues(input: {
  industry: import("@prisma/client").WorkspaceIndustry;
  documentType: BusinessDocumentType;
  values: Record<string, FieldValueInput>;
}) {
  const definitions = await listActiveFieldDefinitions({
    industry: input.industry,
    documentType: input.documentType,
  });

  const definitionByKey = new Map(definitions.map((definition) => [definition.key, definition]));
  const validated: Array<{
    fieldKey: string;
    valueType: IndustryFieldValueType;
    value: FieldValueInput;
  }> = [];

  for (const definition of definitions) {
    const rawValue = input.values[definition.key];
    const isEmpty =
      rawValue === undefined ||
      rawValue === null ||
      rawValue === "" ||
      (typeof rawValue === "string" && rawValue.trim() === "");

    if (definition.required && isEmpty) {
      throw new DocumentFieldValidationError(`Field "${definition.key}" is required.`);
    }

    if (isEmpty) {
      continue;
    }

    validateValueForType(
      {
        key: definition.key,
        valueType: definition.valueType,
        required: definition.required,
        options: (definition.options as SelectOption[] | null) ?? null,
      },
      rawValue,
    );
    validated.push({
      fieldKey: definition.key,
      valueType: definition.valueType,
      value: rawValue,
    });
  }

  for (const key of Object.keys(input.values)) {
    if (definitionByKey.has(key)) {
      continue;
    }

    const rawValue = input.values[key];
    const isEmpty =
      rawValue === undefined ||
      rawValue === null ||
      rawValue === "" ||
      (typeof rawValue === "string" && rawValue.trim() === "");

    if (!isEmpty) {
      throw new DocumentFieldValidationError(`Unknown field "${key}".`);
    }
  }

  return validated;
}

function validateValueForType(definition: Definition, value: FieldValueInput) {
  switch (definition.valueType) {
    case "TEXT":
    case "SELECT":
      if (typeof value !== "string" || value.trim().length === 0) {
        throw new DocumentFieldValidationError(`Field "${definition.key}" must be text.`);
      }

      if (definition.valueType === "SELECT") {
        const options = definition.options ?? [];
        const allowed = new Set(options.map((option) => option.value));

        if (!allowed.has(value)) {
          throw new DocumentFieldValidationError(`Field "${definition.key}" has an invalid option.`);
        }
      }
      break;
    case "NUMBER":
      if (typeof value !== "number" || Number.isNaN(value)) {
        throw new DocumentFieldValidationError(`Field "${definition.key}" must be a number.`);
      }
      break;
    case "DATE":
      if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
        throw new DocumentFieldValidationError(`Field "${definition.key}" must be a valid date.`);
      }
      break;
    case "BOOLEAN":
      if (typeof value !== "boolean") {
        throw new DocumentFieldValidationError(`Field "${definition.key}" must be true or false.`);
      }
      break;
    default:
      throw new DocumentFieldValidationError(`Unsupported field type for "${definition.key}".`);
  }
}

export async function upsertDocumentFieldValues(input: {
  workspaceId: string;
  industry: import("@prisma/client").WorkspaceIndustry;
  documentType: BusinessDocumentType;
  documentId: string;
  values: Record<string, FieldValueInput>;
}) {
  const validated = await validateDocumentFieldValues({
    industry: input.industry,
    documentType: input.documentType,
    values: input.values,
  });

  const { upsertDocumentFieldValuesRecord } = await import(
    "@/features/industry-fields/server/repository"
  );

  return upsertDocumentFieldValuesRecord({
    workspaceId: input.workspaceId,
    documentType: input.documentType,
    documentId: input.documentId,
    values: validated,
  });
}
