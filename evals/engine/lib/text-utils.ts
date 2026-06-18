export function normalizeEvalText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function textContainsTerm(haystack: string, term: string): boolean {
  return normalizeEvalText(haystack).includes(normalizeEvalText(term));
}

export function fuzzySectionMatch(actual: string, expected: string): boolean {
  const a = normalizeEvalText(actual.trim());
  const e = normalizeEvalText(expected.trim());
  return a === e || a.includes(e) || e.includes(a);
}
