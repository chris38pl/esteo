const MIN_TERM_LENGTH = 4;
const MIN_STEM_LENGTH = 4;
const MIN_PARTIAL_STEM_LENGTH = 6;
const MAX_INFLECTION_SUFFIX_LENGTH = 6;

/** English derivations that should not match Polish inflection (market ≠ marketing). */
const BLOCKED_SUFFIXES = /^ing$/i;

/** Allowed English compound suffixes after a Polish/short prefix (copy ↔ copywriting). */
const ALLOWED_DERIVATION_SUFFIXES = /^(writing|building)$/i;

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

function trimTrailingVowels(word: string): string {
  let end = word.length;
  while (end > 3 && /[aeiouąęóuy]/iu.test(word[end - 1]!)) {
    end--;
  }
  return word.slice(0, end);
}

function polishIrregularPair(word: string, term: string): boolean {
  const pairKey = [word, term].sort().join("|");
  const irregularPairs = new Set([
    "najem|najmu",
    "okien|okna",
    "okna|okno",
    "okien|okno",
  ]);
  return irregularPairs.has(pairKey);
}

function loosePolishStemMatch(word: string, term: string): boolean {
  if (polishIrregularPair(word, term)) {
    return true;
  }
  if (word.length < 4 || term.length < 4) {
    return false;
  }

  const wordStem = trimTrailingVowels(word);
  const termStem = trimTrailingVowels(term);
  const stemPrefix = commonPrefixLength(wordStem, termStem);
  if (stemPrefix >= 3 && stemPrefix >= Math.min(wordStem.length, termStem.length) - 1) {
    return true;
  }

  const prefixLen = commonPrefixLength(word, term);
  if (
    prefixLen >= 3 &&
    Math.abs(word.length - term.length) <= 2 &&
    prefixLen >= Math.min(word.length, term.length) - 2
  ) {
    return true;
  }

  return false;
}

function inflectionSuffixAllowed(suffix: string, term: string): boolean {
  if (suffix.length === 0) {
    return true;
  }
  if (ALLOWED_DERIVATION_SUFFIXES.test(suffix)) {
    return true;
  }
  if (suffix.length > MAX_INFLECTION_SUFFIX_LENGTH) {
    return false;
  }
  if (BLOCKED_SUFFIXES.test(suffix)) {
    return false;
  }
  if (term === "link" && /^[óo]w$/i.test(suffix)) {
    return true;
  }
  return true;
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
    return inflectionSuffixAllowed(suffix, term);
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

  if (loosePolishStemMatch(word, term)) {
    return true;
  }

  if (
    term.length >= MIN_TERM_LENGTH &&
    word.length >= MIN_TERM_LENGTH &&
    word.includes(term) &&
    (ALLOWED_DERIVATION_SUFFIXES.test(word.slice(term.length)) ||
      word.slice(term.length).length <= 3)
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
 * - loose Polish stems (najem/najmu, okna/okien)
 * - English derivations in Polish output (copy/copywriting, link/link building)
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

  if (normalizedTerm === "social" && normalizedHaystack.includes("social")) {
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
