import { BusinessDocumentType, type EstimateRequest, type WorkspaceIndustry } from "@prisma/client";

import { getIndustryFieldsForDocument } from "@/features/industry-fields/server/get-fields-for-workspace";
import { listDocumentFieldValues } from "@/features/industry-fields/server/repository";
import { readTypedFieldValue } from "@/features/industry-fields/server/map-field-value";
import { getIndustryExperienceSegment } from "@/features/estimate-requests/config/industry-experience-config";
import { getIndustryOptionLabel } from "@/features/estimate-requests/config/industry-option-labels";
import {
  parseMultiSelectStoredValue,
} from "@/features/industry-fields/lib/field-select-config";
import type { Locale } from "@/lib/locale";

type CustomerData = {
  fullName?: string;
  email?: string;
  phone?: string;
  project?: { preferredStartDate?: string };
};

type AddressData = {
  streetAddress?: string;
  city?: string;
  postalCode?: string;
  voivodeship?: string;
  serviceLocation?: string;
};

const BRIEF_LABELS = {
  pl: {
    construction: {
      projectDescription: "Opis projektu",
      customer: "Klient",
      fullName: "Imię i nazwisko",
      email: "E-mail",
      phone: "Telefon",
      preferredStart: "Preferowany termin startu",
      address: "Adres",
      street: "Ulica",
      city: "Miasto",
      postalCode: "Kod pocztowy",
      voivodeship: "Województwo",
    },
    services: {
      projectDescription: "Opis usługi",
      customer: "Klient",
      fullName: "Imię i nazwisko",
      email: "E-mail",
      phone: "Telefon",
      preferredStart: "Preferowany termin realizacji",
      serviceLocation: "Miejsce realizacji",
      address: "Adres",
      street: "Ulica",
      city: "Miasto",
      postalCode: "Kod pocztowy",
      voivodeship: "Województwo",
    },
  },
  en: {
    construction: {
      projectDescription: "Project description",
      customer: "Customer",
      fullName: "Full name",
      email: "Email",
      phone: "Phone",
      preferredStart: "Preferred start date",
      address: "Address",
      street: "Street",
      city: "City",
      postalCode: "Postal code",
      voivodeship: "Region",
    },
    services: {
      projectDescription: "Service description",
      customer: "Customer",
      fullName: "Full name",
      email: "Email",
      phone: "Phone",
      preferredStart: "Preferred completion date",
      serviceLocation: "Service location",
      address: "Address",
      street: "Street",
      city: "City",
      postalCode: "Postal code",
      voivodeship: "Region",
    },
  },
} as const;

function formatValue(value: string | number | boolean | Date | null): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value);
}

function formatFieldValueForBrief(
  fieldKey: string,
  value: string | number | boolean | Date | null,
  locale: Locale,
): string {
  if (fieldKey === "product_categories" || fieldKey === "project_types") {
    const items = parseMultiSelectStoredValue(value);
    if (items.length === 0) {
      return "";
    }
    return items
      .map((item) => getIndustryOptionLabel(fieldKey, item, locale, "label"))
      .join(", ");
  }
  if (fieldKey === "budget_tier" && typeof value === "string") {
    return getIndustryOptionLabel("budget_tier", value, locale, "label");
  }
  if (fieldKey === "building_type" && typeof value === "string") {
    return getIndustryOptionLabel("building_type", value, locale, "label");
  }
  return formatValue(value);
}

export async function buildProjectBrief(input: {
  request: Pick<EstimateRequest, "id" | "workspaceId" | "projectDescription" | "customerData" | "address">;
  industry: WorkspaceIndustry;
  locale: Locale;
}): Promise<string> {
  const segment = getIndustryExperienceSegment(input.industry);
  const labels = BRIEF_LABELS[input.locale][segment];
  const lines: string[] = [];

  lines.push(`${labels.projectDescription}:`);
  lines.push(input.request.projectDescription.trim());

  const customer = input.request.customerData as CustomerData | null;
  if (customer?.fullName || customer?.email || customer?.phone) {
    lines.push("");
    lines.push(`${labels.customer}:`);
    if (customer.fullName) {
      lines.push(`${labels.fullName}: ${customer.fullName}`);
    }
    if (customer.email) {
      lines.push(`${labels.email}: ${customer.email}`);
    }
    if (customer.phone) {
      lines.push(`${labels.phone}: ${customer.phone}`);
    }
    if (customer.project?.preferredStartDate) {
      lines.push(`${labels.preferredStart}: ${customer.project.preferredStartDate}`);
    }
  }

  const address = input.request.address as AddressData | null;

  if (segment === "services") {
    const serviceLabels = labels as (typeof BRIEF_LABELS)["pl"]["services"];
    if (address?.serviceLocation?.trim()) {
      lines.push("");
      lines.push(`${serviceLabels.serviceLocation}: ${address.serviceLocation.trim()}`);
    }
  } else if (address?.streetAddress || address?.city) {
    lines.push("");
    lines.push(`${labels.address}:`);
    if (address.streetAddress) {
      lines.push(`${labels.street}: ${address.streetAddress}`);
    }
    if (address.postalCode || address.city) {
      lines.push(
        `${labels.postalCode}: ${address.postalCode ?? ""} ${labels.city}: ${address.city ?? ""}`.trim(),
      );
    }
    if (address.voivodeship) {
      lines.push(`${labels.voivodeship}: ${address.voivodeship}`);
    }
  }

  const [fieldDefinitions, fieldValues] = await Promise.all([
    getIndustryFieldsForDocument({
      workspaceId: input.request.workspaceId,
      documentType: BusinessDocumentType.ESTIMATE_REQUEST,
      locale: input.locale,
    }),
    listDocumentFieldValues({
      workspaceId: input.request.workspaceId,
      documentType: BusinessDocumentType.ESTIMATE_REQUEST,
      documentId: input.request.id,
    }),
  ]);

  const valueByKey = new Map(fieldValues.map((row) => [row.fieldKey, row]));

  for (const field of fieldDefinitions) {
    const row = valueByKey.get(field.key);
    if (!row) {
      continue;
    }
    const raw = readTypedFieldValue(row);
    const text = formatFieldValueForBrief(field.key, raw, input.locale);
    if (!text) {
      continue;
    }
    lines.push("");
    lines.push(`${field.label}: ${text}`);
  }

  return lines.join("\n");
}
