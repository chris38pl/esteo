import type { WorkspaceIndustry } from "@prisma/client";
import { BusinessDocumentType } from "@prisma/client";

import { ALLOWED_ATTACHMENT_MIME_TYPES } from "@/features/attachments/lib/allowed-mime-types";
import { MAX_FILE_SIZE_MB } from "@/features/attachments/lib/constants";
import {
  MAX_REQUEST_ATTACHMENT_FILES,
  MAX_REQUEST_ATTACHMENT_TOTAL_BYTES,
} from "@/features/attachments/lib/request-limits";
import {
  getIndustryFieldsForDocument,
  type IndustryFieldForDocument,
} from "@/features/industry-fields/server/get-fields-for-workspace";
import { getIndustryOptionLabel } from "@/features/estimate-requests/config/industry-option-labels";
import { isServiceWorkspace } from "@/features/workspaces/lib/industries";
import { INTEGRATION_SCHEMA_VERSION } from "@/server/integrations/version";
import { prisma } from "@/db/client";
import type { Locale } from "@/lib/locale";

export type IntegrationFieldDictionaryEntry = {
  key: string;
  label: string;
  description: string | null;
  valueType: string;
  required: boolean;
  /** Allowed values for SELECT / MULTI_SELECT. Empty for free-text / number / boolean. */
  allowedValues: Array<{ value: string; label: string }>;
};

export type IntegrationSchemaResponse = {
  version: number;
  schema: Record<string, unknown>;
  example: Record<string, unknown>;
  /** Human-readable industry field dictionary (incl. allowedValues for selects). */
  fields: IntegrationFieldDictionaryEntry[];
  limits: {
    maxAttachments: number;
    maxAttachmentSizeMb: number;
    maxTotalSizeMb: number;
    allowedMimeTypes: readonly string[];
  };
};

function exampleValueForField(field: IndustryFieldForDocument): string | number | boolean {
  if (field.options && field.options.length > 0) {
    return field.options[0]!.value;
  }

  switch (field.valueType) {
    case "NUMBER":
      return 50;
    case "BOOLEAN":
      return true;
    default:
      return "example";
  }
}

function toFieldDictionary(
  fields: IndustryFieldForDocument[],
  locale: Locale,
): IntegrationFieldDictionaryEntry[] {
  return fields.map((field) => ({
    key: field.key,
    label: field.label,
    description: field.description,
    valueType: field.valueType,
    required: field.required,
    allowedValues: (field.options ?? []).map((option) => ({
      value: option.value,
      label: getIndustryOptionLabel(field.key, option.value, locale, "label"),
    })),
  }));
}

function industryFieldJsonSchemaProperties(
  fields: IndustryFieldForDocument[],
): Record<string, unknown> {
  const properties: Record<string, unknown> = {};

  for (const field of fields) {
    const allowed = (field.options ?? []).map((option) => option.value);

    if (field.valueType === "SELECT" && allowed.length > 0) {
      properties[field.key] = {
        type: "string",
        enum: allowed,
        description: field.label,
      };
      continue;
    }

    if (field.valueType === "MULTI_SELECT" && allowed.length > 0) {
      properties[field.key] = {
        oneOf: [
          { type: "string", enum: allowed },
          { type: "array", items: { type: "string", enum: allowed } },
        ],
        description: field.label,
      };
      continue;
    }

    if (field.valueType === "NUMBER") {
      properties[field.key] = { type: "number", description: field.label };
      continue;
    }

    if (field.valueType === "BOOLEAN") {
      properties[field.key] = { type: "boolean", description: field.label };
      continue;
    }

    properties[field.key] = { type: "string", description: field.label };
  }

  return properties;
}

function constructionBaseExample(): Record<string, unknown> {
  return {
    customer: {
      fullName: "Jan Kowalski",
      email: "jan.kowalski@example.com",
      phone: "+48123456789",
    },
    address: {
      streetAddress: "ul. Przykładowa 1",
      city: "Warszawa",
      postalCode: "00-001",
      voivodeship: "mazowieckie",
    },
    project: {
      preferredStartDate: "asap",
      description:
        "Proszę o wycenę remontu łazienki około 6 m2, wymiana glazury i armatury.",
    },
    industryFields: {} as Record<string, string | number | boolean>,
  };
}

function serviceBaseExample(): Record<string, unknown> {
  return {
    customer: {
      fullName: "Anna Nowak",
      email: "anna.nowak@example.com",
      phone: "+48987654321",
    },
    address: {
      serviceLocation: "Online / Warszawa",
    },
    project: {
      preferredStartDate: "1_3_months",
      description:
        "Potrzebuję wyceny usługi zgodnej z opisem na stronie - szczegóły w załącznikach.",
    },
    industryFields: {} as Record<string, string | number | boolean>,
  };
}

function buildJsonSchema(
  industry: WorkspaceIndustry,
  fields: IndustryFieldForDocument[],
): Record<string, unknown> {
  const addressProperties = isServiceWorkspace(industry)
    ? {
        serviceLocation: { type: "string", minLength: 2, maxLength: 300 },
      }
    : {
        streetAddress: { type: "string", minLength: 3, maxLength: 200 },
        city: { type: "string", minLength: 2, maxLength: 120 },
        postalCode: { type: "string", minLength: 2, maxLength: 20 },
        voivodeship: { type: "string", minLength: 2, maxLength: 80 },
      };

  const requiredAddress = isServiceWorkspace(industry)
    ? ["serviceLocation"]
    : ["streetAddress", "city", "postalCode", "voivodeship"];

  const requiredIndustryKeys = fields.filter((field) => field.required).map((field) => field.key);

  return {
    type: "object",
    required: ["customer", "address", "project", "industryFields"],
    properties: {
      customer: {
        type: "object",
        required: ["fullName", "email", "phone"],
        properties: {
          fullName: { type: "string", minLength: 2, maxLength: 120 },
          email: { type: "string", format: "email", maxLength: 160 },
          phone: { type: "string", minLength: 6, maxLength: 40 },
        },
      },
      address: {
        type: "object",
        required: requiredAddress,
        properties: addressProperties,
      },
      project: {
        type: "object",
        required: ["preferredStartDate", "description"],
        properties: {
          preferredStartDate: { type: "string", minLength: 2, maxLength: 40 },
          description: { type: "string", minLength: 20, maxLength: 4000 },
        },
      },
      industryFields: {
        type: "object",
        required: requiredIndustryKeys,
        properties: industryFieldJsonSchemaProperties(fields),
        additionalProperties: false,
      },
    },
  };
}

function attachmentLimits() {
  return {
    maxAttachments: MAX_REQUEST_ATTACHMENT_FILES,
    maxAttachmentSizeMb: MAX_FILE_SIZE_MB,
    maxTotalSizeMb: MAX_REQUEST_ATTACHMENT_TOTAL_BYTES / (1024 * 1024),
    allowedMimeTypes: ALLOWED_ATTACHMENT_MIME_TYPES,
  };
}

/** Sync helper for smoke tests - empty industry fields (no DB). Prefer async builder in production. */
export function buildIntegrationSchema(industry: WorkspaceIndustry): IntegrationSchemaResponse {
  const example = isServiceWorkspace(industry)
    ? serviceBaseExample()
    : constructionBaseExample();

  return {
    version: INTEGRATION_SCHEMA_VERSION,
    schema: buildJsonSchema(industry, []),
    example,
    fields: [],
    limits: attachmentLimits(),
  };
}

export async function buildIntegrationSchemaForWorkspace(input: {
  workspaceId: string;
  locale?: Locale;
}): Promise<IntegrationSchemaResponse | null> {
  const workspace = await prisma.workspace.findFirst({
    where: { id: input.workspaceId, deletedAt: null },
    select: { industry: true },
  });

  if (!workspace) {
    return null;
  }

  const locale = input.locale ?? "pl";

  const fields = await getIndustryFieldsForDocument({
    workspaceId: input.workspaceId,
    documentType: BusinessDocumentType.ESTIMATE_REQUEST,
    locale,
    intakeSurface: "public",
  });

  const industryFields: Record<string, string | number | boolean> = {};
  for (const field of fields) {
    industryFields[field.key] = exampleValueForField(field);
  }

  const example = isServiceWorkspace(workspace.industry)
    ? serviceBaseExample()
    : constructionBaseExample();
  example.industryFields = industryFields;

  return {
    version: INTEGRATION_SCHEMA_VERSION,
    schema: buildJsonSchema(workspace.industry, fields),
    example,
    fields: toFieldDictionary(fields, locale),
    limits: attachmentLimits(),
  };
}
