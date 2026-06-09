import type { EstimateRequestStatus, EstimateVersionStatus, Prisma } from "@prisma/client";

import type {
  getEstimateForEditor,
  getVersionWithTree,
} from "@/features/estimates/server/repository";

type RawEstimate = NonNullable<Awaited<ReturnType<typeof getEstimateForEditor>>>;
type RawVersionTree = NonNullable<Awaited<ReturnType<typeof getVersionWithTree>>>;

function toNumber(value: Prisma.Decimal | number): number {
  return Number(value);
}

export type EstimateForEditorClient = {
  id: string;
  workspaceId: string;
  title: string | null;
  currency: string;
  latestVersionId: string | null;
  createdAt: string;
  updatedAt: string;
  estimateRequest: {
    id: string;
    requestNumber: string | null;
    status: EstimateRequestStatus;
    customerData: Prisma.JsonValue;
    address: Prisma.JsonValue;
    projectDescription: string;
    createdAt: string;
  } | null;
  latestVersion: {
    id: string;
    versionNumber: number;
    status: EstimateVersionStatus;
    marginPercent: number;
    totalNet: number;
    totalGross: number;
    createdByUserId: string | null;
    updatedAt: string;
  } | null;
  versions: Array<{
    id: string;
    versionNumber: number;
    status: EstimateVersionStatus;
    marginPercent: number;
    totalNet: number;
    totalGross: number;
    createdAt: string;
    createdByUserId: string | null;
    updatedAt: string;
  }>;
};

export type VersionTreeClient = {
  id: string;
  estimateId: string;
  workspaceId: string;
  versionNumber: number;
  status: EstimateVersionStatus;
  marginPercent: number;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  sections: Array<{
    id: string;
    workspaceId: string;
    versionId: string;
    title: string;
    sortOrder: number;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
    lineItems: Array<{
      id: string;
      workspaceId: string;
      sectionId: string;
      name: string;
      unit: string | null;
      quantity: number;
      unitPrice: number;
      vatRate: number;
      sortOrder: number;
      deletedAt: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
  }>;
};

export function serializeEstimateForEditor(raw: RawEstimate): EstimateForEditorClient {
  return {
    id: raw.id,
    workspaceId: raw.workspaceId,
    title: raw.title,
    currency: raw.currency,
    latestVersionId: raw.latestVersionId,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
    estimateRequest: raw.estimateRequest
      ? {
          id: raw.estimateRequest.id,
          requestNumber: raw.estimateRequest.requestNumber,
          status: raw.estimateRequest.status,
          customerData: raw.estimateRequest.customerData,
          address: raw.estimateRequest.address,
          projectDescription: raw.estimateRequest.projectDescription,
          createdAt: raw.estimateRequest.createdAt.toISOString(),
        }
      : null,
    latestVersion: raw.latestVersion
      ? {
          id: raw.latestVersion.id,
          versionNumber: raw.latestVersion.versionNumber,
          status: raw.latestVersion.status,
          marginPercent: toNumber(raw.latestVersion.marginPercent),
          totalNet: toNumber(raw.latestVersion.totalNet),
          totalGross: toNumber(raw.latestVersion.totalGross),
          createdByUserId: raw.latestVersion.createdByUserId,
          updatedAt: raw.latestVersion.updatedAt.toISOString(),
        }
      : null,
    versions: raw.versions.map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      status: version.status,
      marginPercent: toNumber(version.marginPercent),
      totalNet: toNumber(version.totalNet),
      totalGross: toNumber(version.totalGross),
      createdAt: version.createdAt.toISOString(),
      createdByUserId: version.createdByUserId,
      updatedAt: version.updatedAt.toISOString(),
    })),
  };
}

export function serializeVersionWithTree(raw: RawVersionTree): VersionTreeClient {
  return {
    id: raw.id,
    estimateId: raw.estimateId,
    workspaceId: raw.workspaceId,
    versionNumber: raw.versionNumber,
    status: raw.status,
    marginPercent: toNumber(raw.marginPercent),
    createdByUserId: raw.createdByUserId,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
    sections: raw.sections.map((section) => ({
      id: section.id,
      workspaceId: section.workspaceId,
      versionId: section.versionId,
      title: section.title,
      sortOrder: section.sortOrder,
      deletedAt: section.deletedAt?.toISOString() ?? null,
      createdAt: section.createdAt.toISOString(),
      updatedAt: section.updatedAt.toISOString(),
      lineItems: section.lineItems.map((item) => ({
        id: item.id,
        workspaceId: item.workspaceId,
        sectionId: item.sectionId,
        name: item.name,
        unit: item.unit,
        quantity: toNumber(item.quantity),
        unitPrice: toNumber(item.unitPrice),
        vatRate: toNumber(item.vatRate),
        sortOrder: item.sortOrder,
        deletedAt: item.deletedAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    })),
  };
}
