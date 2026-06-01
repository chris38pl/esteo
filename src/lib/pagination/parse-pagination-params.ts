import type { PaginationParams } from "@/lib/pagination/types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function parsePaginationParams(input: {
  page?: string;
  pageSize?: string;
}): PaginationParams {
  const page = Math.max(1, Number(input.page) || DEFAULT_PAGE);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(input.pageSize) || DEFAULT_PAGE_SIZE));
  return { page, pageSize };
}

export function toPrismaSkipTake(params: PaginationParams): { skip: number; take: number } {
  return { skip: (params.page - 1) * params.pageSize, take: params.pageSize };
}

