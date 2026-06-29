import type { AdminWorkspaceSearchResult } from "./types";

const SEARCH_STORAGE_KEY = "esteo:admin-workspace-browser:queries";
const WORKSPACE_STORAGE_KEY = "esteo:admin-workspace-browser:workspaces";
const MAX_RECENT_SEARCHES = 10;
const MAX_RECENT_WORKSPACES = 8;

export type RecentAdminWorkspace = Pick<
  AdminWorkspaceSearchResult,
  "id" | "name" | "slug" | "ownerName" | "ownerEmail" | "logoUrl"
> & {
  openedAt: string;
};

function readJsonArray<T>(key: string, predicate: (value: unknown) => value is T): T[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(predicate);
  } catch {
    return [];
  }
}

function writeJsonArray<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors.
  }
}

function isRecentWorkspace(value: unknown): value is RecentAdminWorkspace {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RecentAdminWorkspace>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.slug === "string" &&
    typeof candidate.ownerEmail === "string" &&
    typeof candidate.openedAt === "string"
  );
}

export function getRecentAdminWorkspaceSearches(): string[] {
  return readJsonArray(SEARCH_STORAGE_KEY, (value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, MAX_RECENT_SEARCHES);
}

export function addRecentAdminWorkspaceSearch(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return getRecentAdminWorkspaceSearches();
  }

  const next = [
    trimmed,
    ...getRecentAdminWorkspaceSearches().filter((item) => item !== trimmed),
  ].slice(0, MAX_RECENT_SEARCHES);

  writeJsonArray(SEARCH_STORAGE_KEY, next);
  return next;
}

export function removeRecentAdminWorkspaceSearch(query: string): string[] {
  const next = getRecentAdminWorkspaceSearches().filter((item) => item !== query);
  writeJsonArray(SEARCH_STORAGE_KEY, next);
  return next;
}

export function clearRecentAdminWorkspaceSearches(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(SEARCH_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

export function getRecentAdminWorkspaces(): RecentAdminWorkspace[] {
  return readJsonArray(WORKSPACE_STORAGE_KEY, isRecentWorkspace).slice(0, MAX_RECENT_WORKSPACES);
}

export function addRecentAdminWorkspace(
  workspace: AdminWorkspaceSearchResult | RecentAdminWorkspace,
): RecentAdminWorkspace[] {
  const nextItem: RecentAdminWorkspace = {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    ownerName: workspace.ownerName,
    ownerEmail: workspace.ownerEmail,
    logoUrl: workspace.logoUrl,
    openedAt: new Date().toISOString(),
  };

  const next = [
    nextItem,
    ...getRecentAdminWorkspaces().filter((item) => item.id !== workspace.id),
  ].slice(0, MAX_RECENT_WORKSPACES);

  writeJsonArray(WORKSPACE_STORAGE_KEY, next);
  return next;
}
