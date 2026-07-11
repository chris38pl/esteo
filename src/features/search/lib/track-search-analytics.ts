import type { SearchEntityType } from "@prisma/client";

/** V2 - wire to posthog-js when NEXT_PUBLIC_POSTHOG_KEY is set */
export type SearchQueryEvent = {
  workspaceId: string;
  query: string;
  resultsCount: number;
};

export type SearchResultClickedEvent = {
  workspaceId: string;
  entityType: SearchEntityType;
  entityId: string;
  position: number;
};

export function trackSearchQuery(_event: SearchQueryEvent): void {
  // no-op V1
}

export function trackSearchResultClicked(_event: SearchResultClickedEvent): void {
  // no-op V1
}
