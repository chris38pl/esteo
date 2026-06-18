import {
  BusinessDocumentType,
  SearchEntityType,
  SearchIconType,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/db/client";
import { formatBytes } from "@/features/attachments/lib/format-bytes";
import {
  parseRequestAttachmentRecords,
  type RequestAttachmentRecord,
} from "@/features/attachments/lib/request-attachment-metadata";
import {
  parseRequestAddress,
  parseRequestCustomerData,
} from "@/features/estimate-requests/lib/parse-request-json";
import { listDocumentFieldValues } from "@/features/industry-fields/server/repository";

import { buildSearchText } from "./build-search-text";
import { buildSearchUrlPath } from "./search-url";
import type { SearchDocumentMetadata } from "./search-types";

export type BuiltSearchDocument = {
  workspaceId: string;
  workspaceSlugSnapshot: string;
  entityType: SearchEntityType;
  entityId: string;
  iconType: SearchIconType;
  title: string;
  subtitle: string | null;
  searchText: string;
  url: string;
  metadata: SearchDocumentMetadata;
};

function iconTypeForEntity(entityType: SearchEntityType): SearchIconType {
  switch (entityType) {
    case "ESTIMATE":
      return "ESTIMATE";
    case "INQUIRY":
      return "REQUEST";
    case "ATTACHMENT":
      return "FILE";
    default:
      return "FILE";
  }
}

function formatCustomerSubtitle(
  customerName: string | null | undefined,
  city: string | null | undefined,
  street: string | null | undefined,
): string | null {
  const location = [city, street].filter(Boolean).join(", ");
  if (customerName && location) {
    return `${customerName} • ${location}`;
  }
  return customerName ?? location ?? null;
}

async function loadIndustryFieldTexts(
  workspaceId: string,
  documentId: string,
): Promise<string[]> {
  const values = await listDocumentFieldValues({
    workspaceId,
    documentType: BusinessDocumentType.ESTIMATE_REQUEST,
    documentId,
  });

  return values
    .map((row) => row.valueText ?? (row.valueNumber != null ? String(row.valueNumber) : null))
    .filter((value): value is string => Boolean(value?.trim()));
}

async function getWorkspaceSlug(workspaceId: string): Promise<string> {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: { slug: true },
  });
  return workspace.slug;
}

export async function buildEstimateSearchDocument(
  estimateId: string,
): Promise<BuiltSearchDocument | null> {
  const estimate = await prisma.estimate.findFirst({
    where: { id: estimateId, deletedAt: null },
    select: {
      id: true,
      workspaceId: true,
      title: true,
      estimateRequest: {
        select: {
          id: true,
          requestNumber: true,
          projectDescription: true,
          customerData: true,
          address: true,
        },
      },
      latestVersion: {
        select: { status: true },
      },
    },
  });

  if (!estimate) {
    return null;
  }

  const workspaceSlug = await getWorkspaceSlug(estimate.workspaceId);
  const request = estimate.estimateRequest;
  const customer = parseRequestCustomerData(request?.customerData);
  const address = parseRequestAddress(request?.address);
  const industryTexts = request
    ? await loadIndustryFieldTexts(estimate.workspaceId, request.id)
    : [];

  const title = estimate.title?.trim() || "Wycena";
  const searchFields: SearchDocumentMetadata["searchFields"] = {
    title,
    requestNumber: request?.requestNumber ?? undefined,
    customerName: customer?.fullName,
    customerEmail: customer?.email,
    customerPhone: customer?.phone,
    streetAddress: address?.streetAddress,
    city: address?.city,
    postalCode: address?.postalCode,
    projectDescription: request?.projectDescription,
  };

  const extraSearchLines = industryTexts.join("\n");
  const searchText = [buildSearchText(searchFields), extraSearchLines].filter(Boolean).join("\n");

  const metadata: SearchDocumentMetadata = {
    searchFields,
    status: estimate.latestVersion?.status,
    requestId: request?.id,
  };

  return {
    workspaceId: estimate.workspaceId,
    workspaceSlugSnapshot: workspaceSlug,
    entityType: "ESTIMATE",
    entityId: estimate.id,
    iconType: iconTypeForEntity("ESTIMATE"),
    title,
    subtitle: formatCustomerSubtitle(customer?.fullName, address?.city, address?.streetAddress),
    searchText,
    url: buildSearchUrlPath({
      entityType: "ESTIMATE",
      entityId: estimate.id,
      workspaceSlug,
      metadata,
    }),
    metadata,
  };
}

export async function buildInquirySearchDocument(
  requestId: string,
): Promise<BuiltSearchDocument | null> {
  const request = await prisma.estimateRequest.findFirst({
    where: { id: requestId, deletedAt: null },
    select: {
      id: true,
      workspaceId: true,
      requestNumber: true,
      status: true,
      projectDescription: true,
      customerData: true,
      address: true,
      attachments: true,
      estimate: { select: { title: true } },
    },
  });

  if (!request) {
    return null;
  }

  const workspaceSlug = await getWorkspaceSlug(request.workspaceId);
  const customer = parseRequestCustomerData(request.customerData);
  const address = parseRequestAddress(request.address);
  const industryTexts = await loadIndustryFieldTexts(request.workspaceId, request.id);
  const attachmentNames = parseRequestAttachmentRecords(request.attachments)
    .filter((record) => record.status === "stored")
    .map((record) => record.originalFileName);

  const title =
    customer?.fullName?.trim() ||
    request.requestNumber?.trim() ||
    request.estimate?.title?.trim() ||
    "Zapytanie";

  const searchFields: SearchDocumentMetadata["searchFields"] = {
    title,
    requestNumber: request.requestNumber ?? undefined,
    customerName: customer?.fullName,
    customerEmail: customer?.email,
    customerPhone: customer?.phone,
    streetAddress: address?.streetAddress,
    city: address?.city,
    postalCode: address?.postalCode,
    projectDescription: request.projectDescription,
  };

  const searchText = [
    buildSearchText(searchFields),
    industryTexts.join("\n"),
    attachmentNames.join("\n"),
  ]
    .filter(Boolean)
    .join("\n");

  const metadata: SearchDocumentMetadata = {
    searchFields,
    status: request.status,
    requestId: request.id,
  };

  const subtitle =
    customer?.email ??
    request.requestNumber ??
    formatCustomerSubtitle(customer?.fullName, address?.city, address?.streetAddress);

  return {
    workspaceId: request.workspaceId,
    workspaceSlugSnapshot: workspaceSlug,
    entityType: "INQUIRY",
    entityId: request.id,
    iconType: iconTypeForEntity("INQUIRY"),
    title,
    subtitle,
    searchText,
    url: buildSearchUrlPath({
      entityType: "INQUIRY",
      entityId: request.id,
      workspaceSlug,
      metadata,
    }),
    metadata,
  };
}

export async function buildEstimateAttachmentSearchDocument(
  attachmentId: string,
): Promise<BuiltSearchDocument | null> {
  const attachment = await prisma.estimateAttachment.findFirst({
    where: { id: attachmentId },
    select: {
      id: true,
      workspaceId: true,
      estimateId: true,
      originalFileName: true,
      mimeType: true,
      fileSizeBytes: true,
      attachmentType: true,
      estimate: {
        select: {
          title: true,
          deletedAt: true,
          estimateRequest: {
            select: {
              customerData: true,
            },
          },
        },
      },
    },
  });

  if (!attachment || attachment.estimate.deletedAt) {
    return null;
  }

  const workspaceSlug = await getWorkspaceSlug(attachment.workspaceId);
  const customer = parseRequestCustomerData(attachment.estimate.estimateRequest?.customerData);
  const estimateTitle = attachment.estimate.title?.trim() || customer?.fullName || "Wycena";
  const sizeLabel = formatBytes(attachment.fileSizeBytes);

  const searchFields: SearchDocumentMetadata["searchFields"] = {
    title: attachment.originalFileName,
    fileName: attachment.originalFileName,
    customerName: customer?.fullName,
    customerEmail: customer?.email,
  };

  const metadata: SearchDocumentMetadata = {
    searchFields,
    estimateId: attachment.estimateId,
    fileSizeBytes: Number(attachment.fileSizeBytes),
    mimeType: attachment.mimeType,
  };

  return {
    workspaceId: attachment.workspaceId,
    workspaceSlugSnapshot: workspaceSlug,
    entityType: "ATTACHMENT",
    entityId: attachment.id,
    iconType: iconTypeForEntity("ATTACHMENT"),
    title: attachment.originalFileName,
    subtitle: `${estimateTitle} • ${attachment.attachmentType} • ${sizeLabel}`,
    searchText: buildSearchText({
      ...searchFields,
      title: [attachment.originalFileName, estimateTitle, customer?.fullName, customer?.email]
        .filter(Boolean)
        .join("\n"),
    }),
    url: buildSearchUrlPath({
      entityType: "ATTACHMENT",
      entityId: attachment.id,
      workspaceSlug,
      metadata,
    }),
    metadata,
  };
}

export async function buildRequestAttachmentSearchDocument(input: {
  requestId: string;
  attachment: RequestAttachmentRecord;
}): Promise<BuiltSearchDocument | null> {
  const request = await prisma.estimateRequest.findFirst({
    where: { id: input.requestId, deletedAt: null },
    select: {
      id: true,
      workspaceId: true,
      requestNumber: true,
      customerData: true,
      estimate: { select: { title: true } },
    },
  });

  if (!request || input.attachment.status !== "stored") {
    return null;
  }

  const workspaceSlug = await getWorkspaceSlug(request.workspaceId);
  const customer = parseRequestCustomerData(request.customerData);
  const contextLabel =
    request.estimate?.title?.trim() ||
    customer?.fullName?.trim() ||
    request.requestNumber?.trim() ||
    "Zapytanie";
  const sizeLabel = formatBytes(input.attachment.fileSizeBytes);

  const searchFields: SearchDocumentMetadata["searchFields"] = {
    title: input.attachment.originalFileName,
    fileName: input.attachment.originalFileName,
    customerName: customer?.fullName,
    requestNumber: request.requestNumber ?? undefined,
  };

  const metadata: SearchDocumentMetadata = {
    searchFields,
    requestId: request.id,
    fileSizeBytes: input.attachment.fileSizeBytes,
    mimeType: input.attachment.mimeType,
  };

  return {
    workspaceId: request.workspaceId,
    workspaceSlugSnapshot: workspaceSlug,
    entityType: "ATTACHMENT",
    entityId: input.attachment.id,
    iconType: iconTypeForEntity("ATTACHMENT"),
    title: input.attachment.originalFileName,
    subtitle: `${contextLabel} • ${input.attachment.attachmentType} • ${sizeLabel}`,
    searchText: buildSearchText({
      ...searchFields,
      title: [
        input.attachment.originalFileName,
        contextLabel,
        customer?.fullName,
        request.requestNumber,
      ]
        .filter(Boolean)
        .join("\n"),
    }),
    url: buildSearchUrlPath({
      entityType: "ATTACHMENT",
      entityId: input.attachment.id,
      workspaceSlug,
      metadata,
    }),
    metadata,
  };
}

export function toPrismaMetadata(
  metadata: SearchDocumentMetadata,
): Prisma.InputJsonValue {
  return metadata as Prisma.InputJsonValue;
}
