import "server-only";

import type { Locale } from "@/lib/locale";

import { groupSearchResults } from "../lib/group-search-results";
import { resolveMatchedField } from "../lib/resolve-matched-field";
import { buildSearchUrl } from "../lib/search-url";
import type { SearchDocumentMetadata, SearchWorkspaceResult } from "../lib/search-types";
import { searchDocuments } from "./repository";

export async function searchWorkspace(input: {
  workspaceId: string;
  query: string;
  locale: Locale;
  workspaceSlug: string;
}): Promise<SearchWorkspaceResult> {
  const rows = await searchDocuments(input.workspaceId, input.query);

  const items = rows.map((row) => {
    const metadata = (row.metadata ?? null) as SearchDocumentMetadata | null;
    return {
      id: row.entityId,
      entityType: row.entityType,
      iconType: row.iconType,
      title: row.title,
      subtitle: row.subtitle ?? undefined,
      url: buildSearchUrl({
        entityType: row.entityType,
        entityId: row.entityId,
        workspaceSlug: input.workspaceSlug,
        locale: input.locale,
        metadata,
      }),
      matchedField: resolveMatchedField(input.query, metadata, row.title),
      workspaceSlugSnapshot: row.workspaceSlugSnapshot ?? undefined,
    };
  });

  return groupSearchResults(items);
}
