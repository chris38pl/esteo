import "server-only";

import {
  AttachmentThumbnailStatus,
  Prisma,
  RequestStagingAttachmentStatus,
} from "@prisma/client";

import { prisma } from "@/db/client";
import { parseRequestAttachmentRecords } from "@/features/attachments/lib/request-attachment-metadata";
import { isStagingExpired } from "@/features/attachments/lib/staging-ttl";
import type { ParsedNodeId } from "@/features/admin-storage/lib/storage-explorer-node-ids";
import {
  collectAllDbStorageKeyRefs,
  collectCanonicalBlobStorageKeys,
  collectLinkedStagingKeys,
  findDuplicateDbKeys,
  isLegacyRequestStorageKey,
} from "@/features/admin-storage/server/storage-explorer-db-keys";
import type {
  StorageExplorerItemClient,
  StorageExplorerSortKey,
  StorageExplorerSummary,
  StorageExplorerTreeNode,
} from "@/features/admin-storage/lib/storage-explorer-types";
import { buildPaginatedResult, type PaginatedResult, type PaginationParams } from "@/lib/pagination";
import type { Locale } from "@/lib/locale";
import { workspaceBrandingSchema } from "@/features/workspaces/schemas/branding";
import { getUtOrphanFilesFromCache } from "@/features/admin-storage/server/storage-explorer-reconcile";
import {
  STORAGE_EXPLORER_ENVIRONMENTS,
  resolveCurrentStorageExplorerEnvironment,
  storageEnvironmentNodeId,
  type StorageExplorerEnvironment,
} from "@/features/admin-storage/lib/storage-explorer-environment";
import { isStorageExplorerContainerNode } from "@/features/admin-storage/lib/storage-explorer-node-ids";

function stats(fileCount: number, totalBytes: bigint) {
  return { fileCount, totalBytes: totalBytes.toString() };
}

function prefixTreeNodeIds(node: StorageExplorerTreeNode, prefix: string): StorageExplorerTreeNode {
  return {
    ...node,
    id: `${prefix}${node.id}`,
    children: node.children?.map((child) => prefixTreeNodeIds(child, prefix)),
  };
}

function buildEmptyEnvironmentContent(prefix: string): StorageExplorerTreeNode[] {
  const empty = stats(0, BigInt(0));

  return [
    {
      id: `${prefix}workspaces`,
      label: "workspaces",
      kind: "group",
      stats: empty,
      children: [],
    },
    {
      id: `${prefix}platform`,
      label: "platform",
      kind: "group",
      stats: empty,
      children: [
        {
          id: `${prefix}platform:issues`,
          label: "issues",
          kind: "category",
          stats: empty,
          children: [],
        },
      ],
    },
    {
      id: `${prefix}orphans`,
      label: "orphans",
      kind: "group",
      stats: empty,
      children: [
        { id: `${prefix}orphans:ut-only`, label: "utOnly", kind: "category", stats: empty },
        { id: `${prefix}orphans:json-unpromoted`, label: "jsonUnpromoted", kind: "category", stats: empty },
        { id: `${prefix}orphans:legacy`, label: "legacy", kind: "category", stats: empty },
        { id: `${prefix}orphans:duplicate-keys`, label: "duplicateKeys", kind: "category", stats: empty },
      ],
    },
  ];
}

function buildEnvironmentTreeNode(input: {
  environment: StorageExplorerEnvironment;
  currentEnvironment: StorageExplorerEnvironment;
  contentChildren: StorageExplorerTreeNode[];
  contentStats: { fileCount: number; totalBytes: bigint };
}): StorageExplorerTreeNode {
  const isCurrent = input.environment === input.currentEnvironment;

  return {
    id: storageEnvironmentNodeId(input.environment),
    label: input.environment,
    kind: "environment",
    environment: input.environment,
    isCurrentEnvironment: isCurrent,
    stats: stats(input.contentStats.fileCount, input.contentStats.totalBytes),
    children: input.contentChildren,
  };
}


function formatEstimateLabel(title: string | null, id: string): string {
  const trimmed = title?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : `Estimate ${id.slice(0, 8)}`;
}

function compareItems(a: StorageExplorerItemClient, b: StorageExplorerItemClient, sort: StorageExplorerSortKey) {
  switch (sort) {
    case "dateAsc":
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    case "nameAsc":
      return a.originalFileName.localeCompare(b.originalFileName, undefined, { sensitivity: "base" });
    case "nameDesc":
      return b.originalFileName.localeCompare(a.originalFileName, undefined, { sensitivity: "base" });
    case "sizeAsc": {
      const aSize = a.fileSizeBytes ? BigInt(a.fileSizeBytes) : BigInt(0);
      const bSize = b.fileSizeBytes ? BigInt(b.fileSizeBytes) : BigInt(0);
      return aSize === bSize ? 0 : aSize < bSize ? -1 : 1;
    }
    case "sizeDesc": {
      const aSize = a.fileSizeBytes ? BigInt(a.fileSizeBytes) : BigInt(0);
      const bSize = b.fileSizeBytes ? BigInt(b.fileSizeBytes) : BigInt(0);
      return aSize === bSize ? 0 : aSize > bSize ? -1 : 1;
    }
    case "dateDesc":
    default:
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }
}

function filterBySearch(items: StorageExplorerItemClient[], search: string): StorageExplorerItemClient[] {
  const query = search.trim().toLowerCase();
  if (!query) return items;

  return items.filter(
    (item) =>
      item.originalFileName.toLowerCase().includes(query) ||
      item.storageKey.toLowerCase().includes(query) ||
      (item.workspaceName?.toLowerCase().includes(query) ?? false) ||
      (item.estimateTitle?.toLowerCase().includes(query) ?? false),
  );
}

function paginateItems(
  items: StorageExplorerItemClient[],
  params: PaginationParams,
  sort: StorageExplorerSortKey,
  search: string,
): PaginatedResult<StorageExplorerItemClient> {
  const filtered = filterBySearch(items, search);
  filtered.sort((a, b) => compareItems(a, b, sort));
  const start = (params.page - 1) * params.pageSize;
  const pageItems = filtered.slice(start, start + params.pageSize);
  return buildPaginatedResult(pageItems, filtered.length, params);
}

async function getWorkspaceMap() {
  const workspaces = await prisma.workspace.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      attachmentStorageUsedBytes: true,
      attachmentStorageLimitBytes: true,
    },
    orderBy: { name: "asc" },
  });

  return new Map(workspaces.map((ws) => [ws.id, ws]));
}

export async function getStorageExplorerSummary(): Promise<StorageExplorerSummary> {
  const [
    estimateAgg,
    stagingActiveAgg,
    issueAgg,
    pdfCount,
    logoSettingsRows,
    workspaceAgg,
    utCache,
  ] = await Promise.all([
    prisma.estimateAttachment.aggregate({
      _count: true,
      _sum: { fileSizeBytes: true },
    }),
    prisma.requestStagingAttachment.aggregate({
      where: {
        status: {
          in: [
            RequestStagingAttachmentStatus.UPLOADING,
            RequestStagingAttachmentStatus.PENDING,
            RequestStagingAttachmentStatus.FAILED,
          ],
        },
        storageKey: { not: null },
      },
      _count: true,
      _sum: { fileSizeBytes: true },
    }),
    prisma.issueAttachment.aggregate({
      _count: true,
      _sum: { fileSizeBytes: true },
    }),
    prisma.estimatePdf.count({ where: { fileKey: { not: null } } }),
    prisma.workspaceSettings.findMany({ select: { branding: true } }),
    prisma.workspace.aggregate({
      _sum: { attachmentStorageUsedBytes: true },
      _count: true,
    }),
    Promise.resolve(getUtOrphanFilesFromCache()),
  ]);

  const estimateBytes = estimateAgg._sum.fileSizeBytes ?? BigInt(0);
  const stagingBytes = stagingActiveAgg._sum.fileSizeBytes ?? BigInt(0);
  const issueBytes = issueAgg._sum.fileSizeBytes ?? BigInt(0);

  const logoCount = logoSettingsRows.filter((settings) => {
    const branding = workspaceBrandingSchema.safeParse(settings.branding);
    return branding.success && Boolean(branding.data.logoStorageKey);
  }).length;

  const quotaCountedBytes = estimateBytes + stagingBytes;
  const quotaCountedFiles = estimateAgg._count + stagingActiveAgg._count;
  const nonQuotaBytes = issueBytes;
  const nonQuotaFiles = issueAgg._count + pdfCount + logoCount;

  return {
    currentEnvironment: resolveCurrentStorageExplorerEnvironment(),
    quotaCountedBytes: quotaCountedBytes.toString(),
    quotaCountedFiles,
    nonQuotaBytes: nonQuotaBytes.toString(),
    nonQuotaFiles,
    workspaceCount: workspaceAgg._count,
    utScanAvailable: true,
    lastUtScanAt: utCache?.scannedAt.toISOString() ?? null,
    utTotalFiles: utCache?.totalUtFiles ?? null,
    utTotalBytes: utCache?.totalUtBytes.toString() ?? null,
    utOrphanFiles: utCache?.utOrphanFiles.length ?? null,
  };
}

export async function getStorageExplorerTree(): Promise<StorageExplorerTreeNode> {
  const workspaceMap = await getWorkspaceMap();
  const workspaceIds = [...workspaceMap.keys()];

  const [
    estimateByWorkspace,
    estimateByEstimate,
    stagingActiveByWorkspace,
    stagingLinkedByWorkspace,
    pdfs,
    issueAgg,
    issueByIssue,
    logoSettings,
    jsonOrphanCount,
    legacyCount,
    duplicateCount,
    utCache,
  ] = await Promise.all([
    prisma.estimateAttachment.groupBy({
      by: ["workspaceId"],
      _count: true,
      _sum: { fileSizeBytes: true },
    }),
    prisma.estimateAttachment.groupBy({
      by: ["workspaceId", "estimateId"],
      _count: true,
      _sum: { fileSizeBytes: true },
    }),
    prisma.requestStagingAttachment.groupBy({
      by: ["workspaceId"],
      where: {
        status: {
          in: [
            RequestStagingAttachmentStatus.UPLOADING,
            RequestStagingAttachmentStatus.PENDING,
            RequestStagingAttachmentStatus.FAILED,
          ],
        },
        storageKey: { not: null },
      },
      _count: true,
      _sum: { fileSizeBytes: true },
    }),
    prisma.requestStagingAttachment.groupBy({
      by: ["workspaceId"],
      where: {
        status: RequestStagingAttachmentStatus.LINKED,
        storageKey: { not: null },
      },
      _count: true,
      _sum: { fileSizeBytes: true },
    }),
    prisma.estimatePdf.findMany({
      where: { fileKey: { not: null } },
      select: {
        id: true,
        fileKey: true,
        estimate: { select: { workspaceId: true, title: true, id: true } },
      },
    }),
    prisma.issueAttachment.aggregate({ _count: true, _sum: { fileSizeBytes: true } }),
    prisma.issueAttachment.groupBy({
      by: ["issueId"],
      _count: true,
      _sum: { fileSizeBytes: true },
    }),
    prisma.workspaceSettings.findMany({ select: { workspaceId: true, branding: true } }),
    countJsonOrphanItems(),
    countLegacyItems(),
    countDuplicateKeyItems(),
    Promise.resolve(getUtOrphanFilesFromCache()),
  ]);

  const estimateIds = [...new Set(estimateByEstimate.map((row) => row.estimateId))];
  const estimates = estimateIds.length
    ? await prisma.estimate.findMany({
        where: { id: { in: estimateIds } },
        select: { id: true, title: true, workspaceId: true },
      })
    : [];
  const estimateMap = new Map(estimates.map((e) => [e.id, e]));

  const issueIds = issueByIssue.map((row) => row.issueId);
  const issues = issueIds.length
    ? await prisma.issue.findMany({
        where: { id: { in: issueIds } },
        select: { id: true, number: true, title: true },
      })
    : [];
  const issueMap = new Map(issues.map((issue) => [issue.id, issue]));

  const estimateAggMap = new Map(estimateByWorkspace.map((row) => [row.workspaceId, row]));
  const stagingActiveMap = new Map(stagingActiveByWorkspace.map((row) => [row.workspaceId, row]));
  const stagingLinkedMap = new Map(stagingLinkedByWorkspace.map((row) => [row.workspaceId, row]));

  const pdfByWorkspace = new Map<string, { count: number; bytes: bigint }>();
  for (const pdf of pdfs) {
    const wsId = pdf.estimate.workspaceId;
    const current = pdfByWorkspace.get(wsId) ?? { count: 0, bytes: BigInt(0) };
    current.count += 1;
    pdfByWorkspace.set(wsId, current);
  }

  const logoByWorkspace = new Map<string, number>();
  for (const settings of logoSettings) {
    const branding = workspaceBrandingSchema.safeParse(settings.branding);
    if (branding.success && branding.data.logoStorageKey) {
      logoByWorkspace.set(settings.workspaceId, 1);
    }
  }

  const workspaceNodes: StorageExplorerTreeNode[] = workspaceIds.map((workspaceId) => {
    const ws = workspaceMap.get(workspaceId)!;
    const estimateAgg = estimateAggMap.get(workspaceId);
    const stagingActive = stagingActiveMap.get(workspaceId);
    const stagingLinked = stagingLinkedMap.get(workspaceId);
    const pdfAgg = pdfByWorkspace.get(workspaceId);
    const logoCount = logoByWorkspace.get(workspaceId) ?? 0;

    const estimateChildren = estimateByEstimate
      .filter((row) => row.workspaceId === workspaceId)
      .map((row) => {
        const estimate = estimateMap.get(row.estimateId);
        return {
          id: `workspace:${workspaceId}:estimate:${row.estimateId}`,
          label: formatEstimateLabel(estimate?.title ?? null, row.estimateId),
          kind: "estimate" as const,
          stats: stats(row._count, row._sum.fileSizeBytes ?? BigInt(0)),
          workspaceId,
          workspaceSlug: ws.slug,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

    const estimateNode: StorageExplorerTreeNode = {
      id: `workspace:${workspaceId}:estimates`,
      label: "estimates",
      kind: "category",
      stats: stats(estimateAgg?._count ?? 0, estimateAgg?._sum.fileSizeBytes ?? BigInt(0)),
      workspaceId,
      workspaceSlug: ws.slug,
      children: estimateChildren,
    };

    const children: StorageExplorerTreeNode[] = [
      estimateNode,
      {
        id: `workspace:${workspaceId}:staging-active`,
        label: "stagingActive",
        kind: "category",
        stats: stats(stagingActive?._count ?? 0, stagingActive?._sum.fileSizeBytes ?? BigInt(0)),
        workspaceId,
        workspaceSlug: ws.slug,
      },
      {
        id: `workspace:${workspaceId}:staging-linked`,
        label: "stagingLinked",
        kind: "category",
        stats: stats(stagingLinked?._count ?? 0, stagingLinked?._sum.fileSizeBytes ?? BigInt(0)),
        workspaceId,
        workspaceSlug: ws.slug,
      },
      {
        id: `workspace:${workspaceId}:pdfs`,
        label: "pdfs",
        kind: "category",
        stats: stats(pdfAgg?.count ?? 0, pdfAgg?.bytes ?? BigInt(0)),
        workspaceId,
        workspaceSlug: ws.slug,
      },
      {
        id: `workspace:${workspaceId}:logo`,
        label: "logo",
        kind: "category",
        stats: stats(logoCount, BigInt(0)),
        workspaceId,
        workspaceSlug: ws.slug,
      },
    ];

    const wsFileCount =
      (estimateAgg?._count ?? 0) +
      (stagingActive?._count ?? 0) +
      (stagingLinked?._count ?? 0) +
      (pdfAgg?.count ?? 0) +
      logoCount;

    const wsBytes =
      (estimateAgg?._sum.fileSizeBytes ?? BigInt(0)) +
      (stagingActive?._sum.fileSizeBytes ?? BigInt(0)) +
      (stagingLinked?._sum.fileSizeBytes ?? BigInt(0));

    return {
      id: `workspace:${workspaceId}`,
      label: ws.name,
      kind: "workspace",
      stats: stats(wsFileCount, wsBytes),
      workspaceId,
      workspaceSlug: ws.slug,
      storageUsedBytes: ws.attachmentStorageUsedBytes.toString(),
      storageLimitBytes: ws.attachmentStorageLimitBytes.toString(),
      children,
    };
  });

  const workspacesTotalFiles = workspaceNodes.reduce((sum, node) => sum + node.stats.fileCount, 0);
  const workspacesTotalBytes = workspaceNodes.reduce(
    (sum, node) => sum + BigInt(node.stats.totalBytes),
    BigInt(0),
  );

  const issueChildren: StorageExplorerTreeNode[] = issueByIssue.map((row) => {
    const issue = issueMap.get(row.issueId);
    return {
      id: `platform:issue:${row.issueId}`,
      label: issue ? `#${issue.number} ${issue.title}` : row.issueId.slice(0, 8),
      kind: "issue",
      stats: stats(row._count, row._sum.fileSizeBytes ?? BigInt(0)),
    };
  });

  const orphanUtCount = utCache?.utOrphanFiles.length ?? 0;
  const orphanUtBytes =
    utCache?.utOrphanFiles.reduce((sum, file) => sum + BigInt(file.size), BigInt(0)) ?? BigInt(0);

  const currentEnvironment = resolveCurrentStorageExplorerEnvironment();

  const contentChildren: StorageExplorerTreeNode[] = [
    {
      id: "workspaces",
      label: "workspaces",
      kind: "group",
      stats: stats(workspacesTotalFiles, workspacesTotalBytes),
      children: workspaceNodes,
    },
    {
      id: "platform",
      label: "platform",
      kind: "group",
      stats: stats(issueAgg._count, issueAgg._sum.fileSizeBytes ?? BigInt(0)),
      children: [
        {
          id: "platform:issues",
          label: "issues",
          kind: "category",
          stats: stats(issueAgg._count, issueAgg._sum.fileSizeBytes ?? BigInt(0)),
          children: issueChildren,
        },
      ],
    },
    {
      id: "orphans",
      label: "orphans",
      kind: "group",
      stats: stats(
        orphanUtCount + jsonOrphanCount + legacyCount + duplicateCount,
        orphanUtBytes,
      ),
      children: [
        {
          id: "orphans:ut-only",
          label: "utOnly",
          kind: "category",
          stats: stats(orphanUtCount, orphanUtBytes),
        },
        {
          id: "orphans:json-unpromoted",
          label: "jsonUnpromoted",
          kind: "category",
          stats: stats(jsonOrphanCount, BigInt(0)),
        },
        {
          id: "orphans:legacy",
          label: "legacy",
          kind: "category",
          stats: stats(legacyCount, BigInt(0)),
        },
        {
          id: "orphans:duplicate-keys",
          label: "duplicateKeys",
          kind: "category",
          stats: stats(duplicateCount, BigInt(0)),
        },
      ],
    },
  ];

  const currentContentStats = {
    fileCount: workspacesTotalFiles + issueAgg._count + orphanUtCount,
    totalBytes:
      workspacesTotalBytes + (issueAgg._sum.fileSizeBytes ?? BigInt(0)) + orphanUtBytes,
  };

  const environmentNodes = STORAGE_EXPLORER_ENVIRONMENTS.map((environment) => {
    const prefix = `env:${environment}:`;

    if (environment === currentEnvironment) {
      return buildEnvironmentTreeNode({
        environment,
        currentEnvironment,
        contentStats: currentContentStats,
        contentChildren: contentChildren.map((child) => prefixTreeNodeIds(child, prefix)),
      });
    }

    return buildEnvironmentTreeNode({
      environment,
      currentEnvironment,
      contentStats: { fileCount: 0, totalBytes: BigInt(0) },
      contentChildren: buildEmptyEnvironmentContent(prefix),
    });
  });

  return {
    id: "all",
    label: "all",
    kind: "root",
    stats: stats(currentContentStats.fileCount, currentContentStats.totalBytes),
    children: environmentNodes,
  };
}

async function countJsonOrphanItems(): Promise<number> {
  const items = await buildJsonOrphanItems("pl");
  return items.length;
}

async function countLegacyItems(): Promise<number> {
  const items = await buildLegacyItems("pl");
  return items.length;
}

async function countDuplicateKeyItems(): Promise<number> {
  const items = await buildDuplicateKeyItems("pl");
  return items.length;
}

export async function listStorageExplorerItems(input: {
  node: ParsedNodeId;
  locale: Locale;
  pagination: PaginationParams;
  sort: StorageExplorerSortKey;
  search: string;
}): Promise<PaginatedResult<StorageExplorerItemClient>> {
  const { node, locale, pagination, sort, search } = input;

  if (node.kind === "all" || isStorageExplorerContainerNode(node)) {
    return buildPaginatedResult([], 0, pagination);
  }

  if (node.environment !== resolveCurrentStorageExplorerEnvironment()) {
    return buildPaginatedResult([], 0, pagination);
  }

  let items: StorageExplorerItemClient[] = [];

  switch (node.kind) {
    case "workspace":
      items = await buildWorkspaceAllItems(node.workspaceId, locale);
      break;
    case "workspace_estimates":
      items = await buildEstimateAttachmentItems({ workspaceId: node.workspaceId, locale });
      break;
    case "workspace_estimate":
      items = await buildEstimateAttachmentItems({
        workspaceId: node.workspaceId,
        estimateId: node.estimateId,
        locale,
      });
      break;
    case "workspace_staging_active":
      items = await buildStagingItems({
        workspaceId: node.workspaceId,
        linked: false,
        locale,
      });
      break;
    case "workspace_staging_linked":
      items = await buildStagingItems({
        workspaceId: node.workspaceId,
        linked: true,
        locale,
      });
      break;
    case "workspace_pdfs":
      items = await buildPdfItems(node.workspaceId, locale);
      break;
    case "workspace_logo":
      items = await buildLogoItems(node.workspaceId, locale);
      break;
    case "platform_issues":
      items = await buildIssueItems({ locale });
      break;
    case "platform_issue":
      items = await buildIssueItems({ issueId: node.issueId, locale });
      break;
    case "orphans_ut_only":
      items = await buildUtOrphanItems(locale);
      break;
    case "orphans_json_unpromoted":
      items = await buildJsonOrphanItems(locale);
      break;
    case "orphans_legacy":
      items = await buildLegacyItems(locale);
      break;
    case "orphans_duplicate_keys":
      items = await buildDuplicateKeyItems(locale);
      break;
    default:
      items = [];
  }

  return paginateItems(items, pagination, sort, search);
}

async function buildEstimateAttachmentItems(input: {
  workspaceId: string;
  estimateId?: string;
  locale: Locale;
}): Promise<StorageExplorerItemClient[]> {
  const where: Prisma.EstimateAttachmentWhereInput = {
    workspaceId: input.workspaceId,
    ...(input.estimateId ? { estimateId: input.estimateId } : {}),
  };

  const [rows, workspace, linkedKeys] = await Promise.all([
    prisma.estimateAttachment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        estimate: { select: { id: true, title: true } },
      },
    }),
    prisma.workspace.findUnique({
      where: { id: input.workspaceId },
      select: { name: true, slug: true },
    }),
    collectLinkedStagingKeys(),
  ]);

  const items: StorageExplorerItemClient[] = [];

  for (const row of rows) {
    const estimateTitle = formatEstimateLabel(row.estimate.title, row.estimate.id);
    const contextHref = workspace
      ? `/${input.locale}/dashboard/${workspace.slug}/estimates/${row.estimateId}`
      : null;

    items.push({
      id: row.id,
      storageKey: row.storageKey,
      originalFileName: row.originalFileName,
      mimeType: row.mimeType,
      fileSizeBytes: row.fileSizeBytes.toString(),
      isThumbnail: false,
      healthStatus: linkedKeys.has(row.storageKey) ? "linked_duplicate" : "ok",
      quotaCounted: true,
      createdAt: row.createdAt.toISOString(),
      workspaceId: row.workspaceId,
      workspaceName: workspace?.name ?? null,
      workspaceSlug: workspace?.slug ?? null,
      estimateId: row.estimateId,
      estimateTitle,
      estimateRequestId: null,
      issueId: null,
      issueNumber: null,
      uploadSource: row.uploadSource,
      dbSource: "estimate_attachment",
      contextHref,
      stagingStatus: null,
    });

    if (
      row.thumbnailStorageKey &&
      row.thumbnailStatus === AttachmentThumbnailStatus.GENERATED
    ) {
      items.push({
        id: `${row.id}-thumb`,
        storageKey: row.thumbnailStorageKey,
        originalFileName: `thumb-${row.originalFileName}`,
        mimeType: row.mimeType,
        fileSizeBytes: null,
        isThumbnail: true,
        healthStatus: "ok",
        quotaCounted: true,
        createdAt: row.updatedAt.toISOString(),
        workspaceId: row.workspaceId,
        workspaceName: workspace?.name ?? null,
        workspaceSlug: workspace?.slug ?? null,
        estimateId: row.estimateId,
        estimateTitle,
        estimateRequestId: null,
        issueId: null,
        issueNumber: null,
        uploadSource: row.uploadSource,
        dbSource: "estimate_attachment_thumb",
        contextHref,
        stagingStatus: null,
      });
    }
  }

  return items;
}

async function buildStagingItems(input: {
  workspaceId: string;
  linked: boolean;
  locale: Locale;
}): Promise<StorageExplorerItemClient[]> {
  const statusFilter = input.linked
    ? [RequestStagingAttachmentStatus.LINKED]
    : [
        RequestStagingAttachmentStatus.UPLOADING,
        RequestStagingAttachmentStatus.PENDING,
        RequestStagingAttachmentStatus.FAILED,
      ];

  const [rows, workspace] = await Promise.all([
    prisma.requestStagingAttachment.findMany({
      where: {
        workspaceId: input.workspaceId,
        status: { in: statusFilter },
        storageKey: { not: null },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workspace.findUnique({
      where: { id: input.workspaceId },
      select: { name: true, slug: true },
    }),
  ]);

  const now = Date.now();

  return rows.map((row) => {
    const expired =
      !input.linked &&
      row.status === RequestStagingAttachmentStatus.PENDING &&
      isStagingExpired(row.createdAt, now);

    return {
      id: row.id,
      storageKey: row.storageKey!,
      originalFileName: row.originalFileName,
      mimeType: row.mimeType,
      fileSizeBytes: row.fileSizeBytes.toString(),
      isThumbnail: false,
      healthStatus: input.linked
        ? "linked_duplicate"
        : expired
          ? "staging_expired"
          : "ok",
      quotaCounted: !input.linked && row.status === RequestStagingAttachmentStatus.PENDING,
      createdAt: row.createdAt.toISOString(),
      workspaceId: row.workspaceId,
      workspaceName: workspace?.name ?? null,
      workspaceSlug: workspace?.slug ?? null,
      estimateId: null,
      estimateTitle: null,
      estimateRequestId: row.estimateRequestId,
      issueId: null,
      issueNumber: null,
      uploadSource: row.uploadSource,
      dbSource: "staging",
      contextHref: row.estimateRequestId
        ? `/${input.locale}/dashboard/admin/estimate-requests/${row.estimateRequestId}`
        : null,
      stagingStatus: row.status,
    };
  });
}

async function buildPdfItems(workspaceId: string, locale: Locale): Promise<StorageExplorerItemClient[]> {
  const [rows, workspace] = await Promise.all([
    prisma.estimatePdf.findMany({
      where: {
        fileKey: { not: null },
        estimate: { workspaceId },
      },
      include: {
        estimate: { select: { id: true, title: true } },
      },
      orderBy: { generatedAt: "desc" },
    }),
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true, slug: true },
    }),
  ]);

  return rows
    .filter((row) => row.fileKey)
    .map((row) => ({
      id: row.id,
      storageKey: row.fileKey!,
      originalFileName: `estimate-${row.estimateId.slice(0, 8)}.pdf`,
      mimeType: "application/pdf",
      fileSizeBytes: null,
      isThumbnail: false,
      healthStatus: "ok" as const,
      quotaCounted: false,
      createdAt: row.generatedAt.toISOString(),
      workspaceId,
      workspaceName: workspace?.name ?? null,
      workspaceSlug: workspace?.slug ?? null,
      estimateId: row.estimateId,
      estimateTitle: formatEstimateLabel(row.estimate.title, row.estimate.id),
      estimateRequestId: null,
      issueId: null,
      issueNumber: null,
      uploadSource: null,
      dbSource: "pdf" as const,
      contextHref: workspace
        ? `/${locale}/dashboard/${workspace.slug}/estimates/${row.estimateId}`
        : null,
      stagingStatus: null,
    }));
}

async function buildLogoItems(workspaceId: string, locale: Locale): Promise<StorageExplorerItemClient[]> {
  const [settings, workspace] = await Promise.all([
    prisma.workspaceSettings.findUnique({
      where: { workspaceId },
      select: { branding: true, updatedAt: true },
    }),
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true, slug: true },
    }),
  ]);

  if (!settings) return [];

  const branding = workspaceBrandingSchema.safeParse(settings.branding);
  const logoKey = branding.success ? branding.data.logoStorageKey : undefined;
  if (!logoKey) return [];

  return [
    {
      id: `logo-${workspaceId}`,
      storageKey: logoKey,
      originalFileName: "workspace-logo",
      mimeType: null,
      fileSizeBytes: null,
      isThumbnail: false,
      healthStatus: "ok",
      quotaCounted: false,
      createdAt: settings.updatedAt.toISOString(),
      workspaceId,
      workspaceName: workspace?.name ?? null,
      workspaceSlug: workspace?.slug ?? null,
      estimateId: null,
      estimateTitle: null,
      estimateRequestId: null,
      issueId: null,
      issueNumber: null,
      uploadSource: null,
      dbSource: "logo",
      contextHref: workspace
        ? `/${locale}/dashboard/${workspace.slug}/settings?section=general`
        : null,
      stagingStatus: null,
    },
  ];
}

async function buildIssueItems(input: {
  issueId?: string;
  locale: Locale;
}): Promise<StorageExplorerItemClient[]> {
  const rows = await prisma.issueAttachment.findMany({
    where: input.issueId ? { issueId: input.issueId } : undefined,
    orderBy: [{ issueId: "asc" }, { sortOrder: "asc" }],
    include: {
      issue: { select: { id: true, number: true, title: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    storageKey: row.storageKey,
    originalFileName: row.originalFileName,
    mimeType: row.mimeType,
    fileSizeBytes: row.fileSizeBytes.toString(),
    isThumbnail: false,
    healthStatus: "ok" as const,
    quotaCounted: false,
    createdAt: row.createdAt.toISOString(),
    workspaceId: null,
    workspaceName: null,
    workspaceSlug: null,
    estimateId: null,
    estimateTitle: null,
    estimateRequestId: null,
    issueId: row.issueId,
    issueNumber: row.issue.number,
    uploadSource: null,
    dbSource: "issue" as const,
    contextHref: `/${input.locale}/dashboard/admin/issues/${row.issue.number}`,
    stagingStatus: null,
  }));
}

async function buildWorkspaceAllItems(
  workspaceId: string,
  locale: Locale,
): Promise<StorageExplorerItemClient[]> {
  const [estimates, stagingActive, stagingLinked, pdfs, logos] = await Promise.all([
    buildEstimateAttachmentItems({ workspaceId, locale }),
    buildStagingItems({ workspaceId, linked: false, locale }),
    buildStagingItems({ workspaceId, linked: true, locale }),
    buildPdfItems(workspaceId, locale),
    buildLogoItems(workspaceId, locale),
  ]);

  return [...estimates, ...stagingActive, ...stagingLinked, ...pdfs, ...logos];
}

async function buildUtOrphanItems(locale: Locale): Promise<StorageExplorerItemClient[]> {
  const cache = getUtOrphanFilesFromCache();
  if (!cache) return [];

  return cache.utOrphanFiles.map((file) => ({
    id: `ut-${file.id}`,
    storageKey: file.key,
    originalFileName: file.name,
    mimeType: null,
    fileSizeBytes: String(file.size),
    isThumbnail: false,
    healthStatus: "ut_orphan" as const,
    quotaCounted: false,
    createdAt: new Date(file.uploadedAt).toISOString(),
    workspaceId: null,
    workspaceName: null,
    workspaceSlug: null,
    estimateId: null,
    estimateTitle: null,
    estimateRequestId: null,
    issueId: null,
    issueNumber: null,
    uploadSource: null,
    dbSource: "uploadthing_only" as const,
    contextHref: null,
    stagingStatus: file.status,
  }));
}

async function buildJsonOrphanItems(locale: Locale): Promise<StorageExplorerItemClient[]> {
  const [canonicalKeys, requests, workspaces, estimateAttachmentIds] = await Promise.all([
    collectCanonicalBlobStorageKeys(),
    prisma.estimateRequest.findMany({
      where: { attachments: { not: Prisma.DbNull } },
      select: {
        id: true,
        workspaceId: true,
        attachments: true,
        createdAt: true,
      },
    }),
    prisma.workspace.findMany({ select: { id: true, name: true, slug: true } }),
    prisma.estimateAttachment.findMany({ select: { id: true } }),
  ]);

  const promotedIds = new Set(estimateAttachmentIds.map((row) => row.id));
  const workspaceMap = new Map(workspaces.map((ws) => [ws.id, ws]));
  const items: StorageExplorerItemClient[] = [];

  for (const request of requests) {
    const workspace = workspaceMap.get(request.workspaceId);
    for (const record of parseRequestAttachmentRecords(request.attachments)) {
      if (record.status !== "stored" || record.promotedAt) continue;
      if (canonicalKeys.has(record.storageKey)) continue;
      if (promotedIds.has(record.id)) continue;

      items.push({
        id: `json-${request.id}-${record.id}`,
        storageKey: record.storageKey,
        originalFileName: record.originalFileName,
        mimeType: record.mimeType,
        fileSizeBytes: String(record.fileSizeBytes),
        isThumbnail: false,
        healthStatus: "json_orphan",
        quotaCounted: false,
        createdAt: request.createdAt.toISOString(),
        workspaceId: request.workspaceId,
        workspaceName: workspace?.name ?? null,
        workspaceSlug: workspace?.slug ?? null,
        estimateId: null,
        estimateTitle: null,
        estimateRequestId: request.id,
        issueId: null,
        issueNumber: null,
        uploadSource: null,
        dbSource: "request_json",
        contextHref: `/${locale}/dashboard/admin/estimate-requests/${request.id}`,
        stagingStatus: null,
      });
    }
  }

  return items;
}

async function buildLegacyItems(locale: Locale): Promise<StorageExplorerItemClient[]> {
  const allItems = await buildWorkspaceAllItemsFromAllWorkspaces(locale);
  const jsonItems = await buildJsonOrphanItems(locale);
  const combined = [...allItems, ...jsonItems];

  return combined.filter((item) => isLegacyRequestStorageKey(item.storageKey));
}

async function buildDuplicateKeyItems(locale: Locale): Promise<StorageExplorerItemClient[]> {
  const refs = await collectAllDbStorageKeyRefs();
  const duplicates = findDuplicateDbKeys(refs);
  const items: StorageExplorerItemClient[] = [];

  for (const [storageKey, keyRefs] of duplicates) {
    const linkedPair =
      keyRefs.length === 2 &&
      keyRefs.some((ref) => ref.source === "staging") &&
      keyRefs.some((ref) => ref.source === "estimate_attachment");

    if (linkedPair) continue;

    for (const ref of keyRefs) {
      items.push({
        id: `dup-${ref.recordId}`,
        storageKey,
        originalFileName: storageKey.slice(-32),
        mimeType: null,
        fileSizeBytes: null,
        isThumbnail: false,
        healthStatus: "duplicate_key",
        quotaCounted: false,
        createdAt: new Date(0).toISOString(),
        workspaceId: null,
        workspaceName: null,
        workspaceSlug: null,
        estimateId: null,
        estimateTitle: null,
        estimateRequestId: null,
        issueId: null,
        issueNumber: null,
        uploadSource: ref.source,
        dbSource: "estimate_attachment",
        contextHref: null,
        stagingStatus: ref.source,
      });
    }
  }

  return items;
}

async function buildWorkspaceAllItemsFromAllWorkspaces(
  locale: Locale,
): Promise<StorageExplorerItemClient[]> {
  const workspaces = await prisma.workspace.findMany({ select: { id: true } });
  const chunks = await Promise.all(
    workspaces.map((ws) => buildWorkspaceAllItems(ws.id, locale)),
  );
  return chunks.flat();
}
