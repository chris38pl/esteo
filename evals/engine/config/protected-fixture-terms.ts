export type ProtectedReason =
  | "matcher_deficiency"
  | "prompt_gap"
  | "intentional_strict_test";

export type ProtectedFixtureTerm = {
  scenarioId: string;
  term: string;
  reason: ProtectedReason;
  note?: string;
};

export const PROTECTED_FIXTURE_TERMS: ProtectedFixtureTerm[] = [
  {
    scenarioId: "law-firm",
    term: "najem",
    reason: "matcher_deficiency",
    note: "brief „umowy najmu”",
  },
  {
    scenarioId: "cleaning-company",
    term: "okna",
    reason: "matcher_deficiency",
    note: "brief „mycie okien”",
  },
  {
    scenarioId: "copywriter",
    term: "copy",
    reason: "matcher_deficiency",
    note: "output „Copywriting”",
  },
  {
    scenarioId: "accounting-office",
    term: "faktur",
    reason: "prompt_gap",
    note: "brief „40 faktur”, brak w output",
  },
];

function normalizeProtectedTerm(term: string): string {
  return term.toLowerCase().trim();
}

export function isProtectedFixtureTerm(scenarioId: string, term: string): boolean {
  return getProtectedReason(scenarioId, term) !== null;
}

export function getProtectedReason(
  scenarioId: string,
  term: string,
): ProtectedReason | null {
  const normalizedTerm = normalizeProtectedTerm(term);
  const entry = PROTECTED_FIXTURE_TERMS.find(
    (item) =>
      item.scenarioId === scenarioId &&
      normalizeProtectedTerm(item.term) === normalizedTerm,
  );
  return entry?.reason ?? null;
}

export function getProtectedFixtureTerm(
  scenarioId: string,
  term: string,
): ProtectedFixtureTerm | null {
  const normalizedTerm = normalizeProtectedTerm(term);
  return (
    PROTECTED_FIXTURE_TERMS.find(
      (item) =>
        item.scenarioId === scenarioId &&
        normalizeProtectedTerm(item.term) === normalizedTerm,
    ) ?? null
  );
}

export function listProtectedByReason(reason: ProtectedReason): ProtectedFixtureTerm[] {
  return PROTECTED_FIXTURE_TERMS.filter((item) => item.reason === reason);
}
