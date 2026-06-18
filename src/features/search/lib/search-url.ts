import type { SearchEntityType } from "@prisma/client";

import type { Locale } from "@/lib/locale";

import type { SearchDocumentMetadata } from "./search-types";

export function buildSearchUrlPath(input: {
  entityType: SearchEntityType;
  entityId: string;
  workspaceSlug: string;
  metadata?: SearchDocumentMetadata | null;
}): string {
  const { entityType, entityId, workspaceSlug, metadata } = input;

  switch (entityType) {
    case "ESTIMATE":
      return `dashboard/${workspaceSlug}/estimates/${entityId}`;
    case "INQUIRY":
      return `dashboard/${workspaceSlug}/requests/${entityId}`;
    case "ATTACHMENT": {
      const estimateId = metadata?.estimateId;
      if (estimateId) {
        return `dashboard/${workspaceSlug}/estimates/${estimateId}?tab=attachments`;
      }
      const requestId = metadata?.requestId;
      if (requestId) {
        return `dashboard/${workspaceSlug}/requests/${requestId}`;
      }
      return `dashboard/${workspaceSlug}/estimates`;
    }
    default:
      return `dashboard/${workspaceSlug}`;
  }
}

export function buildSearchUrl(input: {
  entityType: SearchEntityType;
  entityId: string;
  workspaceSlug: string;
  locale: Locale;
  metadata?: SearchDocumentMetadata | null;
}): string {
  const path = buildSearchUrlPath({
    entityType: input.entityType,
    entityId: input.entityId,
    workspaceSlug: input.workspaceSlug,
    metadata: input.metadata,
  });
  return `/${input.locale}/${path}`;
}
