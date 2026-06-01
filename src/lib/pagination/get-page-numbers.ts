export type PageNumberToken = number | "ellipsis";

export function getPageNumbers(
  page: number,
  totalPages: number,
  options?: { siblingCount?: number; boundaryCount?: number },
): PageNumberToken[] {
  const siblingCount = options?.siblingCount ?? 1;
  const boundaryCount = options?.boundaryCount ?? 1;

  if (totalPages <= 1) {
    return [1];
  }

  const startPages = range(1, Math.min(boundaryCount, totalPages));
  const endPages = range(Math.max(totalPages - boundaryCount + 1, boundaryCount + 1), totalPages);

  const siblingsStart = clamp(
    page - siblingCount,
    boundaryCount + 1,
    Math.max(totalPages - boundaryCount - siblingCount * 2 - 1, boundaryCount + 1),
  );
  const siblingsEnd = clamp(
    page + siblingCount,
    Math.min(boundaryCount + siblingCount * 2 + 2, totalPages - boundaryCount),
    totalPages - boundaryCount,
  );

  const tokens: PageNumberToken[] = [];
  tokens.push(...startPages);

  if (siblingsStart > boundaryCount + 1) {
    tokens.push("ellipsis");
  }

  tokens.push(...range(siblingsStart, siblingsEnd));

  if (siblingsEnd < totalPages - boundaryCount) {
    tokens.push("ellipsis");
  }

  tokens.push(...endPages);

  return dedupe(tokens);
}

function range(start: number, end: number): number[] {
  if (end < start) return [];
  const out: number[] = [];
  for (let i = start; i <= end; i += 1) {
    out.push(i);
  }
  return out;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function dedupe(tokens: PageNumberToken[]): PageNumberToken[] {
  const out: PageNumberToken[] = [];
  for (const token of tokens) {
    if (out[out.length - 1] === token) continue;
    out.push(token);
  }
  return out;
}

