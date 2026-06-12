"use client";

import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type OptionalColumnId = "inquiry" | "investment" | "client";

export type EstimatesListPageSize = 10 | 20 | 50;

export type EstimatesListPreferences = {
  visibleColumns: Record<OptionalColumnId, boolean>;
  pageSize: EstimatesListPageSize;
};

export const OPTIONAL_COLUMN_IDS: OptionalColumnId[] = ["inquiry", "investment", "client"];

const PAGE_SIZE_VALUES = new Set<EstimatesListPageSize>([10, 20, 50]);

export const DEFAULT_ESTIMATES_LIST_PREFERENCES: EstimatesListPreferences = {
  visibleColumns: {
    inquiry: true,
    investment: true,
    client: true,
  },
  pageSize: 10,
};

const OPTIONAL_COLUMN_BREAKPOINT_CLASS: Record<OptionalColumnId, string> = {
  inquiry: "hidden md:table-cell",
  investment: "hidden lg:table-cell",
  client: "hidden xl:table-cell",
};

function storageKeyForWorkspace(workspaceSlug: string): string {
  return `esteo.estimates-list-prefs.${workspaceSlug}`;
}

function countVisibleOptionalColumns(
  columns: Record<OptionalColumnId, boolean>,
): number {
  return OPTIONAL_COLUMN_IDS.filter((id) => columns[id]).length;
}

export function setOptionalColumnVisibility(
  columns: Record<OptionalColumnId, boolean>,
  id: OptionalColumnId,
  visible: boolean,
): Record<OptionalColumnId, boolean> | null {
  if (!visible && countVisibleOptionalColumns(columns) <= 1) {
    return null;
  }

  return { ...columns, [id]: visible };
}

export function optionalColumnClassName(
  id: OptionalColumnId,
  visible: boolean,
  cellClassName = "px-4 py-3",
): string {
  return cn(cellClassName, visible ? OPTIONAL_COLUMN_BREAKPOINT_CLASS[id] : "hidden");
}

function parseStoredPreferences(raw: string): EstimatesListPreferences | null {
  try {
    const parsed = JSON.parse(raw) as Partial<EstimatesListPreferences>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const visibleColumns = { ...DEFAULT_ESTIMATES_LIST_PREFERENCES.visibleColumns };
    for (const id of OPTIONAL_COLUMN_IDS) {
      if (typeof parsed.visibleColumns?.[id] === "boolean") {
        visibleColumns[id] = parsed.visibleColumns[id];
      }
    }

    if (countVisibleOptionalColumns(visibleColumns) < 1) {
      return DEFAULT_ESTIMATES_LIST_PREFERENCES;
    }

    const pageSize = PAGE_SIZE_VALUES.has(parsed.pageSize as EstimatesListPageSize)
      ? (parsed.pageSize as EstimatesListPageSize)
      : DEFAULT_ESTIMATES_LIST_PREFERENCES.pageSize;

    return { visibleColumns, pageSize };
  } catch {
    return null;
  }
}

export function useEstimatesListPreferences(workspaceSlug: string) {
  const storageKey = storageKeyForWorkspace(workspaceSlug);
  const [preferences, setPreferencesState] = useState(DEFAULT_ESTIMATES_LIST_PREFERENCES);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = parseStoredPreferences(raw);
        if (parsed) {
          setPreferencesState(parsed);
        }
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const toggleOptionalColumn = useCallback(
    (id: OptionalColumnId, visible: boolean) => {
      setPreferencesState((prev) => {
        const nextColumns = setOptionalColumnVisibility(prev.visibleColumns, id, visible);
        if (!nextColumns) {
          return prev;
        }

        const next = { ...prev, visibleColumns: nextColumns };
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [storageKey],
  );

  const setPageSize = useCallback(
    (pageSize: EstimatesListPageSize) => {
      setPreferencesState((prev) => {
        const next = { ...prev, pageSize };
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [storageKey],
  );

  return {
    preferences,
    toggleOptionalColumn,
    setPageSize,
  };
}
