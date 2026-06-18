const MIN_TERM_LENGTH = 4;
const MIN_STEM_LENGTH = 4;
const MIN_PARTIAL_STEM_LENGTH = 6;
const MAX_INFLECTION_SUFFIX_LENGTH = 6;

/** English derivations that should not match Polish inflection (market ≠ marketing). */
const BLOCKED_SUFFIXES = /^ing$/i;

export function normalizeEvalText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** @deprecated Use polishTermMatch for eval scoring */
export function textContainsTerm(haystack: string, term: string): boolean {
  return polishTermMatch(haystack, term);
}

function splitWords(text: string): string[] {
  return normalizeEvalText(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 0);
}

function commonPrefixLength(a: string, b: string): number {
  const limit = Math.min(a.length, b.length);
  let i = 0;
  while (i < limit && a[i] === b[i]) {
    i++;
  }
  return i;
}

function inflectionSuffixAllowed(suffix: string): boolean {
  if (suffix.length === 0) {
    return true;
  }
  if (suffix.length > MAX_INFLECTION_SUFFIX_LENGTH) {
    return false;
  }
  return !BLOCKED_SUFFIXES.test(suffix);
}

function wordMatchesTerm(word: string, term: string): boolean {
  if (word === term) {
    return true;
  }

  if (term.length >= MIN_TERM_LENGTH && word.startsWith(term)) {
    const suffix = word.slice(term.length);
    if (suffix.length === 0) {
      return true;
    }
    return inflectionSuffixAllowed(suffix);
  }

  if (word.length >= MIN_PARTIAL_STEM_LENGTH && term.startsWith(word)) {
    return true;
  }

  const prefixLen = commonPrefixLength(word, term);
  const shorterLen = Math.min(word.length, term.length);
  if (
    prefixLen >= MIN_STEM_LENGTH &&
    prefixLen >= shorterLen - 3 &&
    (prefixLen >= term.length - 2 || prefixLen >= MIN_PARTIAL_STEM_LENGTH)
  ) {
    return true;
  }

  if (
    word.length >= 7 &&
    term.length >= 7 &&
    word.slice(0, -1) === term.slice(0, -1) &&
    word.slice(0, -1).length >= MIN_PARTIAL_STEM_LENGTH
  ) {
    return true;
  }

  return false;
}

/**
 * Polish term matching for eval harness:
 * - exact word match
 * - prefix + inflection suffix (post → posty, postów, postami)
 * - partial stem prefix (podwykonawc → podwykonawcami)
 * - shared stem / singular–plural variants (spotkanie/spotkania, dekoracja/dekoracje)
 */
export function polishTermMatch(haystack: string, term: string): boolean {
  const normalizedHaystack = normalizeEvalText(haystack);
  const normalizedTerm = normalizeEvalText(term);

  if (!normalizedTerm) {
    return false;
  }

  if (normalizedTerm.includes(" ") && normalizedHaystack.includes(normalizedTerm)) {
    return true;
  }

  const words = splitWords(haystack);
  for (const word of words) {
    if (wordMatchesTerm(word, normalizedTerm)) {
      return true;
    }
  }

  return false;
}

export function fuzzySectionMatch(actual: string, expected: string): boolean {
  const a = normalizeEvalText(actual.trim());
  const e = normalizeEvalText(expected.trim());
  return a === e || a.includes(e) || e.includes(a);
}
