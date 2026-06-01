"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export function usePaginationUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() ?? "";

  const updateQuery = useCallback((updates: Record<string, string | null>) => {
    if (!pathname) {
      return;
    }

    const params = new URLSearchParams(searchParamsString);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) {
        params.delete(key);
        continue;
      }
      params.set(key, value);
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }, [pathname, router, searchParamsString]);

  const setPage = useCallback((page: number) => {
    updateQuery({ page: String(page) });
  }, [updateQuery]);

  const setPageSize = useCallback((pageSize: number) => {
    updateQuery({ page: "1", pageSize: String(pageSize) });
  }, [updateQuery]);

  const setSearch = useCallback((search: string) => {
    const trimmed = search.trim();
    const params = new URLSearchParams(searchParamsString);
    const currentSearch = params.get("search") ?? "";

    if (trimmed === currentSearch) {
      return;
    }

    updateQuery({ page: "1", search: trimmed ? trimmed : null });
  }, [searchParamsString, updateQuery]);

  return useMemo(
    () => ({ updateQuery, setPage, setPageSize, setSearch }),
    [updateQuery, setPage, setPageSize, setSearch],
  );
}

