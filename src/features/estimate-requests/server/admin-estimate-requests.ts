import type { EstimateRequestStatus, WorkspaceIndustry } from "@prisma/client";
import type { User } from "@prisma/client";

import { prisma } from "@/db/client";
import {
  scheduleSoftDeleteSearchDocument,
  scheduleUpsertSearchDocumentForEstimate,
  scheduleUpsertSearchDocumentForInquiry,
} from "@/features/search/server/index-service";
import { buildPaginatedResult, toPrismaSkipTake } from "@/lib/pagination";
import type { PaginatedResult, PaginationParams } from "@/lib/pagination";
import { isPlatformAdmin } from "@/server/permissions/require-workspace";
import { PermissionError } from "@/server/permissions/errors";

type CustomerDataJson = {
  fullName?: string;
  email?: string;
  phone?: string;
  project?: { preferredStartDate?: string };
};

type AddressJson = {
  streetAddress?: string;
  city?: string;
  postalCode?: string;
  voivodeship?: string;
};

export type AdminEstimateRequestRow = {
  id: string;
  requestNumber: string | null;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  workspaceIndustry: WorkspaceIndustry;
  status: EstimateRequestStatus;
  customerFullName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  city: string | null;
  projectDescription: string;
  attachmentCount: number;
  createdAt: Date;
  deletedAt: Date | null;
};

export type AdminEstimateRequestDetail = {
  id: string;
  requestNumber: string | null;
  status: EstimateRequestStatus;
  projectDescription: string;
  attachmentCount: number;
  customerData: CustomerDataJson | null;
  address: AddressJson | null;
  aiMetadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  workspace: {
    id: string;
    name: string;
    slug: string;
    industry: WorkspaceIndustry;
  };
};

function parseCustomerData(raw: unknown): CustomerDataJson | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as CustomerDataJson;
}

function parseAddress(raw: unknown): AddressJson | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as AddressJson;
}

function parseAttachmentCount(raw: unknown): number {
  return Array.isArray(raw) ? raw.length : 0;
}

const requestSelect = {
  id: true,
  requestNumber: true,
  workspaceId: true,
  status: true,
  customerData: true,
  address: true,
  projectDescription: true,
  attachments: true,
  createdAt: true,
  deletedAt: true,
  workspace: {
    select: {
      id: true,
      name: true,
      slug: true,
      industry: true,
    },
  },
} as const;

function mapToRow(
  row: Awaited<ReturnType<typeof prisma.estimateRequest.findMany<{ select: typeof requestSelect }>>>[number],
): AdminEstimateRequestRow {
  const customerData = parseCustomerData(row.customerData);
  const address = parseAddress(row.address);

  return {
    id: row.id,
    requestNumber: row.requestNumber,
    workspaceId: row.workspaceId,
    workspaceName: row.workspace.name,
    workspaceSlug: row.workspace.slug,
    workspaceIndustry: row.workspace.industry,
    status: row.status,
    customerFullName: customerData?.fullName ?? null,
    customerEmail: customerData?.email ?? null,
    customerPhone: customerData?.phone ?? null,
    city: address?.city ?? null,
    projectDescription: row.projectDescription,
    attachmentCount: parseAttachmentCount(row.attachments),
    createdAt: row.createdAt,
    deletedAt: row.deletedAt,
  };
}

function buildListWhere(filters?: { search?: string; includeDeleted?: boolean }) {
  const search = filters?.search?.trim();
  const deletedFilter = filters?.includeDeleted ? {} : { deletedAt: null };

  if (!search) {
    return deletedFilter;
  }

  return {
    AND: [
      deletedFilter,
      {
        OR: [
          { requestNumber: { contains: search, mode: "insensitive" as const } },
          { workspace: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      },
    ],
  };
}

export async function listAdminEstimateRequestsPaginated(
  params: PaginationParams,
  filters?: { search?: string; includeDeleted?: boolean },
): Promise<PaginatedResult<AdminEstimateRequestRow>> {
  const where = buildListWhere(filters);

  const take = params.pageSize;

  const [initialRows, totalCount] = await prisma.$transaction([
    prisma.estimateRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: toPrismaSkipTake(params).skip,
      take,
      select: requestSelect,
    }),
    prisma.estimateRequest.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / params.pageSize));
  const normalizedPage = Math.min(params.page, totalPages);

  const rows =
    normalizedPage === params.page
      ? initialRows
      : await prisma.estimateRequest.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: toPrismaSkipTake({ ...params, page: normalizedPage }).skip,
          take,
          select: requestSelect,
        });

  return buildPaginatedResult(rows.map(mapToRow), totalCount, {
    ...params,
    page: normalizedPage,
  });
}

export async function getAdminEstimateRequestDetail(
  requestId: string,
): Promise<AdminEstimateRequestDetail | null> {
  const row = await prisma.estimateRequest.findFirst({
    where: { id: requestId },
    select: {
      id: true,
      requestNumber: true,
      status: true,
      projectDescription: true,
      customerData: true,
      address: true,
      attachments: true,
      aiMetadata: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      workspace: {
        select: { id: true, name: true, slug: true, industry: true },
      },
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    requestNumber: row.requestNumber,
    status: row.status,
    projectDescription: row.projectDescription,
    attachmentCount: parseAttachmentCount(row.attachments),
    customerData: parseCustomerData(row.customerData),
    address: parseAddress(row.address),
    aiMetadata: row.aiMetadata as Record<string, unknown> | null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    workspace: row.workspace,
  };
}

function assertPlatformAdminUser(user: User): void {
  if (!isPlatformAdmin(user)) {
    throw new PermissionError("Platform admin access required.");
  }
}

export type AdminArchiveEstimateRequestResult = {
  id: string;
  estimateId: string | null;
  workspaceSlug: string;
};

export async function adminArchiveEstimateRequest(
  admin: User,
  requestId: string,
): Promise<AdminArchiveEstimateRequestResult> {
  assertPlatformAdminUser(admin);

  const request = await prisma.estimateRequest.findFirst({
    where: { id: requestId, deletedAt: null },
    select: {
      id: true,
      estimateId: true,
      workspaceId: true,
      workspace: { select: { slug: true } },
    },
  });

  if (!request) {
    throw new PermissionError("Estimate request not found.");
  }

  const deletedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.estimateRequest.update({
      where: { id: requestId },
      data: { deletedAt },
    });

    if (request.estimateId) {
      await tx.estimate.updateMany({
        where: { id: request.estimateId, deletedAt: null },
        data: { deletedAt },
      });
    }
  });

  scheduleSoftDeleteSearchDocument(request.workspaceId, "INQUIRY", request.id);
  if (request.estimateId) {
    scheduleSoftDeleteSearchDocument(request.workspaceId, "ESTIMATE", request.estimateId);
  }

  return {
    id: request.id,
    estimateId: request.estimateId,
    workspaceSlug: request.workspace.slug,
  };
}

export async function adminRestoreEstimateRequest(
  admin: User,
  requestId: string,
): Promise<AdminArchiveEstimateRequestResult> {
  assertPlatformAdminUser(admin);

  const request = await prisma.estimateRequest.findFirst({
    where: { id: requestId, deletedAt: { not: null } },
    select: {
      id: true,
      estimateId: true,
      workspaceId: true,
      workspace: { select: { slug: true } },
    },
  });

  if (!request) {
    throw new PermissionError("Deleted estimate request not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.estimateRequest.update({
      where: { id: requestId },
      data: { deletedAt: null },
    });

    if (request.estimateId) {
      await tx.estimate.updateMany({
        where: { id: request.estimateId, deletedAt: { not: null } },
        data: { deletedAt: null },
      });
    }
  });

  scheduleUpsertSearchDocumentForInquiry(request.id);
  if (request.estimateId) {
    scheduleUpsertSearchDocumentForEstimate(request.estimateId);
  }

  return {
    id: request.id,
    estimateId: request.estimateId,
    workspaceSlug: request.workspace.slug,
  };
}
