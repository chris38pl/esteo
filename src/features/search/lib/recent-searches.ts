const STORAGE_PREFIX = "esteo:search:queries:";
const MAX_RECENT_SEARCHES = 10;

function storageKey(workspaceId: string): string {
  return `${STORAGE_PREFIX}${workspaceId}`;
}

export function getRecentSearches(workspaceId: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKey(workspaceId));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is string => typeof item === "string").slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

export function addRecentSearch(workspaceId: string, query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed || typeof window === "undefined") {
    return getRecentSearches(workspaceId);
  }

  const next = [trimmed, ...getRecentSearches(workspaceId).filter((item) => item !== trimmed)].slice(
    0,
    MAX_RECENT_SEARCHES,
  );

  try {
    window.localStorage.setItem(storageKey(workspaceId), JSON.stringify(next));
  } catch {
    // ignore quota errors
  }

  return next;
}

export function removeRecentSearch(workspaceId: string, query: string): string[] {
  const next = getRecentSearches(workspaceId).filter((item) => item !== query);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(storageKey(workspaceId), JSON.stringify(next));
    } catch {
      // ignore
    }
  }
  return next;
}

export function clearRecentSearches(workspaceId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(storageKey(workspaceId));
  } catch {
    // ignore
  }
}
