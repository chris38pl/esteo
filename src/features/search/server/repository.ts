import "server-only";

import type { SearchEntityType } from "@prisma/client";

import { prisma } from "@/db/client";

const SEARCH_LIMIT = 20;

export type SearchDocumentRow = {
  entityType: SearchEntityType;
  entityId: string;
  iconType: "ESTIMATE" | "REQUEST" | "FILE";
  title: string;
  subtitle: string | null;
  url: string;
  workspaceSlugSnapshot: string | null;
  metadata: unknown;
  rankTier: number;
};

export async function searchDocuments(
  workspaceId: string,
  query: string,
): Promise<SearchDocumentRow[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const pattern = `%${trimmed}%`;

  return prisma.$queryRaw<SearchDocumentRow[]>`
    SELECT
      "entityType",
      "entityId",
      "iconType",
      title,
      subtitle,
      url,
      "workspaceSlugSnapshot",
      metadata,
      CASE
        WHEN lower(title) = lower(${trimmed}) THEN 0
        WHEN lower(title) LIKE lower(${trimmed}) || '%' THEN 1
        WHEN lower("searchText") LIKE '%' || lower(${trimmed}) || '%' THEN 2
        ELSE 3
      END AS "rankTier"
    FROM "SearchDocument"
    WHERE "workspaceId" = ${workspaceId}
      AND "deletedAt" IS NULL
      AND (
        title ILIKE ${pattern}
        OR "searchText" ILIKE ${pattern}
      )
    ORDER BY "rankTier" ASC, "updatedAt" DESC
    LIMIT ${SEARCH_LIMIT}
  `;
}

export async function findSearchDocument(
  workspaceId: string,
  entityType: SearchEntityType,
  entityId: string,
) {
  return prisma.searchDocument.findFirst({
    where: {
      workspaceId,
      entityType,
      entityId,
      deletedAt: null,
    },
  });
}
