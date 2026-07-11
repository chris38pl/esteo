import type { EstimateRequestStatus } from "@prisma/client";
import { BusinessDocumentType } from "@prisma/client";

import { prisma } from "@/db/client";
import { getIndustryOptionLabel } from "@/features/estimate-requests/config/industry-option-labels";
import {
  parseRequestAddress,
  parseRequestAttachmentCount,
  parseRequestCustomerData,
  type RequestAddressData,
  type RequestCustomerData,
} from "@/features/estimate-requests/lib/parse-request-json";
import { getIndustryFieldsForDocument } from "@/features/industry-fields/server/get-fields-for-workspace";
import { readTypedFieldValue } from "@/features/industry-fields/server/map-field-value";
import { listDocumentFieldValues } from "@/features/industry-fields/server/repository";
import type { Locale } from "@/lib/locale";

const listSelect = {
  id: true,
  requestNumber: true,
  status: true,
  customerData: true,
  address: true,
  projectDescription: true,
  attachments: true,
  estimateId: true,
  createdAt: true,
  updatedAt: true,
  estimate: {
    select: {
      id: true,
      title: true,
    },
  },
} as const;

export type WorkspaceRequestListItem = {
  id: string;
  requestNumber: string | null;
  status: EstimateRequestStatus;
  customerFullName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  streetAddress: string | null;
  city: string | null;
  postalCode: string | null;
  propertyType: string | null;
  floorArea: number | null;
  attachmentCount: number;
  estimateId: string | null;
  estimateTitle: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type WorkspaceRequestIndustryFieldRow = {
  key: string;
  label: string;
  value: string;
};

export type WorkspaceRequestDetail = {
  id: string;
  requestNumber: string | null;
  status: EstimateRequestStatus;
  projectDescription: string;
  attachmentCount: number;
  customerData: RequestCustomerData | null;
  address: RequestAddressData | null;
  createdAt: Date;
  updatedAt: Date;
  estimate: {
    id: string;
    title: string | null;
  } | null;
  industryFields: WorkspaceRequestIndustryFieldRow[];
};

type RequestListRow = Awaited<
  ReturnType<typeof prisma.estimateRequest.findMany<{ select: typeof listSelect }>>
>[number];

function mapListRow(
  row: RequestListRow,
  industryFields: {
    propertyType: string | null;
    floorArea: number | null;
  },
): WorkspaceRequestListItem {
  const customerData = parseRequestCustomerData(row.customerData);
  const address = parseRequestAddress(row.address);

  return {
    id: row.id,
    requestNumber: row.requestNumber,
    status: row.status,
    customerFullName: customerData?.fullName ?? null,
    customerEmail: customerData?.email ?? null,
    customerPhone: customerData?.phone ?? null,
    streetAddress: address?.streetAddress ?? null,
    city: address?.city ?? null,
    postalCode: address?.postalCode ?? null,
    propertyType: industryFields.propertyType,
    floorArea: industryFields.floorArea,
    attachmentCount: parseRequestAttachmentCount(row.attachments),
    estimateId: row.estimateId,
    estimateTitle: row.estimate?.title ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const REQUEST_AREA_FIELD_KEYS = ["area_size", "floor_area"] as const;

function parseNumericFieldValue(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }

  if (typeof raw === "string" && raw.trim().length > 0) {
    const parsed = Number.parseFloat(raw.trim().replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function resolveAreaSizeValue(byKey: Map<string, unknown> | undefined): number | null {
  if (!byKey) {
    return null;
  }

  for (const key of REQUEST_AREA_FIELD_KEYS) {
    const parsed = parseNumericFieldValue(byKey.get(key));
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function resolveIndustryListFields(
  requestId: string,
  fieldValues: Map<string, Map<string, unknown>>,
  locale: Locale,
): { propertyType: string | null; floorArea: number | null } {
  const byKey = fieldValues.get(requestId);
  const rawPropertyType = byKey?.get("property_type");

  const propertyType =
    typeof rawPropertyType === "string" && rawPropertyType.length > 0
      ? getIndustryOptionLabel("property_type", rawPropertyType, locale, "label")
      : null;

  return {
    propertyType,
    floorArea: resolveAreaSizeValue(byKey),
  };
}

export async function listWorkspaceEstimateRequests(
  workspaceId: string,
  locale: Locale,
): Promise<WorkspaceRequestListItem[]> {
  const rows = await prisma.estimateRequest.findMany({
    where: { workspaceId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: listSelect,
  });

  const requestIds = rows.map((row) => row.id);

  const industryRows =
    requestIds.length > 0
      ? await prisma.documentFieldValue.findMany({
          where: {
            workspaceId,
            documentType: BusinessDocumentType.ESTIMATE_REQUEST,
            documentId: { in: requestIds },
            fieldKey: { in: ["property_type", ...REQUEST_AREA_FIELD_KEYS] },
          },
        })
      : [];

  const fieldValuesByRequestId = new Map<string, Map<string, unknown>>();

  for (const row of industryRows) {
    const values = fieldValuesByRequestId.get(row.documentId) ?? new Map<string, unknown>();
    values.set(row.fieldKey, readTypedFieldValue(row));
    fieldValuesByRequestId.set(row.documentId, values);
  }

  return rows.map((row) =>
    mapListRow(row, resolveIndustryListFields(row.id, fieldValuesByRequestId, locale)),
  );
}

function formatIndustryFieldValue(
  fieldKey: string,
  valueType: string,
  raw: unknown,
  locale: Locale,
): string {
  if (raw === null || raw === undefined || raw === "") {
    return "-";
  }

  if (valueType === "SELECT" && typeof raw === "string") {
    return getIndustryOptionLabel(fieldKey, raw, locale, "label");
  }

  if (typeof raw === "boolean") {
    return raw ? (locale === "pl" ? "Tak" : "Yes") : locale === "pl" ? "Nie" : "No";
  }

  return String(raw);
}

export async function getWorkspaceEstimateRequestDetail(input: {
  requestId: string;
  workspaceId: string;
  locale: Locale;
}): Promise<WorkspaceRequestDetail | null> {
  const row = await prisma.estimateRequest.findFirst({
    where: {
      id: input.requestId,
      workspaceId: input.workspaceId,
      deletedAt: null,
    },
    select: {
      id: true,
      requestNumber: true,
      status: true,
      projectDescription: true,
      customerData: true,
      address: true,
      attachments: true,
      createdAt: true,
      updatedAt: true,
      estimate: {
        select: { id: true, title: true },
      },
    },
  });

  if (!row) {
    return null;
  }

  const [fieldDefinitions, fieldValues] = await Promise.all([
    getIndustryFieldsForDocument({
      workspaceId: input.workspaceId,
      documentType: BusinessDocumentType.ESTIMATE_REQUEST,
      locale: input.locale,
    }),
    listDocumentFieldValues({
      workspaceId: input.workspaceId,
      documentType: BusinessDocumentType.ESTIMATE_REQUEST,
      documentId: row.id,
    }),
  ]);

  const industryFields = fieldDefinitions.map((field) => {
    const stored = fieldValues.find((value) => value.fieldKey === field.key);
    const raw = stored ? readTypedFieldValue(stored) : null;

    return {
      key: field.key,
      label: field.label,
      value: formatIndustryFieldValue(field.key, field.valueType, raw, input.locale),
    };
  });

  return {
    id: row.id,
    requestNumber: row.requestNumber,
    status: row.status,
    projectDescription: row.projectDescription,
    attachmentCount: parseRequestAttachmentCount(row.attachments),
    customerData: parseRequestCustomerData(row.customerData),
    address: parseRequestAddress(row.address),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    estimate: row.estimate,
    industryFields,
  };
}
