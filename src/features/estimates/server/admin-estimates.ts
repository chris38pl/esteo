import { BusinessDocumentType, Prisma, type EstimateVersionStatus } from "@prisma/client";

import { prisma } from "@/db/client";
import { getIndustryOptionLabel } from "@/features/estimate-requests/config/industry-option-labels";
import {
  parseRequestAddress,
  parseRequestCustomerData,
} from "@/features/estimate-requests/lib/parse-request-json";
import { readTypedFieldValue } from "@/features/industry-fields/server/map-field-value";
import type { EstimateListDateField } from "@/features/estimates/lib/estimate-list-filter";
import type { EstimateListItem } from "@/features/estimates/server/repository";
import type { EstimateListPageItem } from "@/features/estimates/server/list-estimates-page-data";
import { resolveUserEmailsByIds } from "@/features/users/server/resolve-user-emails";
import type { Locale } from "@/lib/locale";
import { buildPaginatedResult, toPrismaSkipTake } from "@/lib/pagination";
import type { PaginatedResult, PaginationParams } from "@/lib/pagination";

export type AdminEstimatesListFilters = {
  search?: string;
  workspaceId?: string;
  status?: EstimateVersionStatus;
  dateField?: EstimateListDateField;
  dateFrom?: Date;
  dateTo?: Date;
};

export type AdminEstimateWorkspaceFilterOption = {
  id: string;
  name: string;
  slug: string;
  ownerName: string | null;
  ownerEmail: string;
};

export type AdminEstimateListRow = EstimateListPageItem & {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  workspaceOwnerName: string | null;
  workspaceOwnerEmail: string;
};

const ESTIMATE_VERSION_STATUSES = new Set<string>([
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
]);

const estimateInclude = {
  latestVersion: {
    select: {
      id: true,
      versionNumber: true,
      status: true,
      archivedAt: true,
      updatedAt: true,
      createdByUserId: true,
    },
  },
  estimateRequest: {
    select: {
      id: true,
      requestNumber: true,
      status: true,
      createdAt: true,
      customerData: true,
      address: true,
    },
  },
  workspace: {
    select: {
      id: true,
      name: true,
      slug: true,
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  },
  _count: {
    select: { versions: true },
  },
} as const;

type EstimateQueryRow = Prisma.EstimateGetPayload<{
  include: typeof estimateInclude;
}>;

function buildListWhere(filters?: AdminEstimatesListFilters): Prisma.EstimateWhereInput {
  const and: Prisma.EstimateWhereInput[] = [
    { deletedAt: null },
    { workspace: { deletedAt: null } },
  ];

  if (filters?.workspaceId) {
    and.push({ workspaceId: filters.workspaceId });
  }

  const search = filters?.search?.trim();
  if (search) {
    and.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { estimateRequest: { requestNumber: { contains: search, mode: "insensitive" } } },
        { workspace: { name: { contains: search, mode: "insensitive" } } },
        { workspace: { slug: { contains: search, mode: "insensitive" } } },
        { workspace: { owner: { name: { contains: search, mode: "insensitive" } } } },
        { workspace: { owner: { email: { contains: search, mode: "insensitive" } } } },
      ],
    });
  }

  if (filters?.status) {
    and.push({ latestVersion: { status: filters.status } });
  }

  const dateField = filters?.dateField ?? "updated";
  if (filters?.dateFrom || filters?.dateTo) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (filters.dateFrom) {
      dateFilter.gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      dateFilter.lte = filters.dateTo;
    }

    if (dateField === "created") {
      and.push({ createdAt: dateFilter });
    } else if (dateField === "requestCreated") {
      and.push({ estimateRequest: { createdAt: dateFilter } });
    } else {
      and.push({ latestVersion: { updatedAt: dateFilter } });
    }
  }

  return { AND: and };
}

function stripWorkspace(row: EstimateQueryRow): EstimateListItem {
  const estimate = { ...row };
  delete (estimate as Partial<EstimateQueryRow>).workspace;
  return estimate as EstimateListItem;
}

async function attachVersionTotals(rows: EstimateQueryRow[]): Promise<EstimateListItem[]> {
  const versionIds = rows
    .map((row) => row.latestVersion?.id)
    .filter((id): id is string => Boolean(id));

  if (versionIds.length === 0) {
    return rows.map((row): EstimateListItem => {
      const estimate = stripWorkspace(row);
      if (!estimate.latestVersion) {
        return estimate;
      }

      return {
        ...estimate,
        latestVersion: {
          ...estimate.latestVersion,
          totalNet: 0,
          totalGross: 0,
        },
      };
    });
  }

  const totalsRows = await prisma.$queryRaw<
    Array<{ id: string; totalNet: Prisma.Decimal; totalGross: Prisma.Decimal }>
  >`
    SELECT id, "totalNet", "totalGross"
    FROM "EstimateVersion"
    WHERE id IN (${Prisma.join(versionIds)})
  `;

  const totalsById = new Map(
    totalsRows.map((row) => [
      row.id,
      {
        totalNet: Number(row.totalNet),
        totalGross: Number(row.totalGross),
      },
    ]),
  );

  return rows.map((row): EstimateListItem => {
    const estimate = stripWorkspace(row);

    if (!estimate.latestVersion) {
      return estimate;
    }

    const totals = totalsById.get(estimate.latestVersion.id) ?? {
      totalNet: 0,
      totalGross: 0,
    };

    return {
      ...estimate,
      latestVersion: {
        ...estimate.latestVersion,
        ...totals,
      },
    };
  });
}

async function enrichEstimateRows(
  rows: EstimateQueryRow[],
  locale: Locale,
): Promise<AdminEstimateListRow[]> {
  const withTotals = await attachVersionTotals(rows);

  const requestIds = withTotals
    .map((estimate) => estimate.estimateRequest?.id)
    .filter((id): id is string => Boolean(id));

  const propertyRows =
    requestIds.length > 0
      ? await prisma.documentFieldValue.findMany({
          where: {
            documentType: BusinessDocumentType.ESTIMATE_REQUEST,
            documentId: { in: requestIds },
            fieldKey: "property_type",
          },
        })
      : [];

  const propertyByRequestId = new Map(
    propertyRows.map((row) => [row.documentId, readTypedFieldValue(row)]),
  );

  const userEmails = await resolveUserEmailsByIds(
    withTotals.map((estimate) => estimate.latestVersion?.createdByUserId),
  );

  return withTotals.map((estimate, index) => {
    const workspaceRow = rows[index]!.workspace;
    const request = estimate.estimateRequest;
    const customer = parseRequestCustomerData(request?.customerData);
    const address = parseRequestAddress(request?.address);
    const rawProperty = request?.id ? propertyByRequestId.get(request.id) : null;
    const investmentPropertyType =
      typeof rawProperty === "string" && rawProperty.length > 0
        ? getIndustryOptionLabel("property_type", rawProperty, locale, "label")
        : null;

    return {
      ...estimate,
      workspaceId: workspaceRow.id,
      workspaceName: workspaceRow.name,
      workspaceSlug: workspaceRow.slug,
      workspaceOwnerName: workspaceRow.owner.name,
      workspaceOwnerEmail: workspaceRow.owner.email,
      listContext: {
        investmentPropertyType,
        customerName: customer?.fullName ?? null,
        customerEmail: customer?.email ?? null,
        investmentStreet: address?.streetAddress ?? null,
        investmentCity: address?.city ?? null,
        updatedByEmail:
          userEmails.get(estimate.latestVersion?.createdByUserId ?? "") ?? null,
      },
    };
  });
}

export function parseAdminEstimatesListFilters(input: {
  search?: string;
  workspaceId?: string;
  status?: string;
  dateField?: string;
  dateFrom?: string;
  dateTo?: string;
}): AdminEstimatesListFilters {
  const dateFields = new Set<EstimateListDateField>(["updated", "created", "requestCreated"]);
  const parsedDateField = input.dateField as EstimateListDateField | undefined;

  const parseDate = (value: string | undefined): Date | undefined => {
    if (!value) {
      return undefined;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  };

  const status =
    input.status && ESTIMATE_VERSION_STATUSES.has(input.status)
      ? (input.status as EstimateVersionStatus)
      : undefined;

  return {
    search: input.search?.trim() || undefined,
    workspaceId: input.workspaceId?.trim() || undefined,
    status,
    dateField: parsedDateField && dateFields.has(parsedDateField) ? parsedDateField : undefined,
    dateFrom: parseDate(input.dateFrom),
    dateTo: parseDate(input.dateTo),
  };
}

export async function listAdminEstimateWorkspaceFilterOptions(
  search?: string,
): Promise<AdminEstimateWorkspaceFilterOption[]> {
  const trimmed = search?.trim();

  const rows = await prisma.workspace.findMany({
    where: {
      deletedAt: null,
      ...(trimmed
        ? {
            OR: [
              { name: { contains: trimmed, mode: "insensitive" } },
              { slug: { contains: trimmed, mode: "insensitive" } },
              { owner: { name: { contains: trimmed, mode: "insensitive" } } },
              { owner: { email: { contains: trimmed, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ name: "asc" }],
    take: 50,
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    ownerName: row.owner.name,
    ownerEmail: row.owner.email,
  }));
}

export async function listAdminEstimatesPaginated(
  params: PaginationParams,
  filters: AdminEstimatesListFilters,
  locale: Locale,
): Promise<PaginatedResult<AdminEstimateListRow>> {
  const where = buildListWhere(filters);
  const take = params.pageSize;

  const [initialRows, totalCount] = await prisma.$transaction([
    prisma.estimate.findMany({
      where,
      orderBy: [{ latestVersion: { updatedAt: "desc" } }, { createdAt: "desc" }],
      skip: toPrismaSkipTake(params).skip,
      take,
      include: estimateInclude,
    }),
    prisma.estimate.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / params.pageSize));
  const normalizedPage = Math.min(params.page, totalPages);

  const rows =
    normalizedPage === params.page
      ? initialRows
      : await prisma.estimate.findMany({
          where,
          orderBy: [{ latestVersion: { updatedAt: "desc" } }, { createdAt: "desc" }],
          skip: toPrismaSkipTake({ ...params, page: normalizedPage }).skip,
          take,
          include: estimateInclude,
        });

  const items = await enrichEstimateRows(rows, locale);

  return buildPaginatedResult(items, totalCount, {
    ...params,
    page: normalizedPage,
  });
}

export async function getAdminEstimatesListStats(
  filters: AdminEstimatesListFilters,
  locale: Locale,
): Promise<EstimateListPageItem[]> {
  const where = buildListWhere(filters);

  const rows = await prisma.estimate.findMany({
    where,
    select: {
      id: true,
      workspaceId: true,
      title: true,
      currency: true,
      attachmentCount: true,
      aiMetadata: true,
      latestVersionId: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
      latestVersion: {
        select: {
          id: true,
          versionNumber: true,
          status: true,
          archivedAt: true,
          updatedAt: true,
          createdByUserId: true,
          totalNet: true,
          totalGross: true,
        },
      },
      estimateRequest: {
        select: {
          id: true,
          requestNumber: true,
          status: true,
          createdAt: true,
          customerData: true,
          address: true,
        },
      },
      _count: {
        select: { versions: true },
      },
    },
  });

  const items: EstimateListPageItem[] = rows.map((row) => ({
    ...row,
    latestVersion: row.latestVersion
      ? {
          ...row.latestVersion,
          totalNet: Number(row.latestVersion.totalNet),
          totalGross: Number(row.latestVersion.totalGross),
        }
      : null,
    listContext: {
      investmentPropertyType: null,
      customerName: null,
      customerEmail: null,
      investmentStreet: null,
      investmentCity: null,
      updatedByEmail: null,
    },
  }));

  if (items.length === 0) {
    return items;
  }

  const requestIds = items
    .map((estimate) => estimate.estimateRequest?.id)
    .filter((id): id is string => Boolean(id));

  const propertyRows =
    requestIds.length > 0
      ? await prisma.documentFieldValue.findMany({
          where: {
            documentType: BusinessDocumentType.ESTIMATE_REQUEST,
            documentId: { in: requestIds },
            fieldKey: "property_type",
          },
        })
      : [];

  const propertyByRequestId = new Map(
    propertyRows.map((row) => [row.documentId, readTypedFieldValue(row)]),
  );

  return items.map((estimate) => {
    const request = estimate.estimateRequest;
    const customer = parseRequestCustomerData(request?.customerData);
    const address = parseRequestAddress(request?.address);
    const rawProperty = request?.id ? propertyByRequestId.get(request.id) : null;
    const investmentPropertyType =
      typeof rawProperty === "string" && rawProperty.length > 0
        ? getIndustryOptionLabel("property_type", rawProperty, locale, "label")
        : null;

    return {
      ...estimate,
      listContext: {
        investmentPropertyType,
        customerName: customer?.fullName ?? null,
        customerEmail: customer?.email ?? null,
        investmentStreet: address?.streetAddress ?? null,
        investmentCity: address?.city ?? null,
        updatedByEmail: null,
      },
    };
  });
}
