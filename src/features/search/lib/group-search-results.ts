import type { SearchEntityType } from "@prisma/client";

import type { SearchResultItem, SearchWorkspaceResult } from "./search-types";

const PER_GROUP_LIMIT = 5;

export function groupSearchResults(
  rows: SearchResultItem[],
  options?: { perGroupLimit?: number },
): SearchWorkspaceResult {
  const limit = options?.perGroupLimit ?? PER_GROUP_LIMIT;
  const estimates: SearchResultItem[] = [];
  const inquiries: SearchResultItem[] = [];
  const attachments: SearchResultItem[] = [];

  for (const row of rows) {
    const bucket = bucketForEntityType(row.entityType);
    if (bucket.length < limit) {
      bucket.push(row);
    }
  }

  return { estimates, inquiries, attachments };

  function bucketForEntityType(entityType: SearchEntityType): SearchResultItem[] {
    switch (entityType) {
      case "ESTIMATE":
        return estimates;
      case "INQUIRY":
        return inquiries;
      case "ATTACHMENT":
        return attachments;
      default:
        return estimates;
    }
  }
}
