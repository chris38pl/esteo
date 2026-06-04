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
  city: string | null;
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

function mapListRow(
  row: Awaited<
    ReturnType<
      typeof prisma.estimateRequest.findMany<{ select: typeof listSelect }>
    >
  >[number],
): WorkspaceRequestListItem {
  const customerData = parseRequestCustomerData(row.customerData);
  const address = parseRequestAddress(row.address);

  return {
    id: row.id,
    requestNumber: row.requestNumber,
    status: row.status,
    customerFullName: customerData?.fullName ?? null,
    customerEmail: customerData?.email ?? null,
    city: address?.city ?? null,
    attachmentCount: parseRequestAttachmentCount(row.attachments),
    estimateId: row.estimateId,
    estimateTitle: row.estimate?.title ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listWorkspaceEstimateRequests(
  workspaceId: string,
): Promise<WorkspaceRequestListItem[]> {
  const rows = await prisma.estimateRequest.findMany({
    where: { workspaceId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: listSelect,
  });

  return rows.map(mapListRow);
}

function formatIndustryFieldValue(
  fieldKey: string,
  valueType: string,
  raw: unknown,
  locale: Locale,
): string {
  if (raw === null || raw === undefined || raw === "") {
    return "—";
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
