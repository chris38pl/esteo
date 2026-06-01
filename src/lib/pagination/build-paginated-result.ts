import type { PaginatedResult, PaginationParams } from "@/lib/pagination/types";

export function buildPaginatedResult<T>(
  items: T[],
  totalCount: number,
  params: PaginationParams,
): PaginatedResult<T> {
  const totalPages = Math.max(1, Math.ceil(totalCount / params.pageSize));
  const page = Math.min(params.page, totalPages);

  return {
    items,
    page,
    pageSize: params.pageSize,
    totalCount,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

