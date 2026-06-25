/** Commercial Section (Sekcja handlowa) — shared vocabulary for prompts and validation. */

export const NARRATIVE_SECTION_TITLE_PATTERNS = [
  /^zakres(\s+prac)?$/i,
  /^scope(\s+of\s+work)?$/i,
  /^uwagi$/i,
  /^notes?$/i,
  /^opis$/i,
  /^description$/i,
  /^notatki$/i,
] as const;

export const META_SECTION_TITLE_PATTERNS = [
  /^oferta$/i,
  /^kosztorys$/i,
  /^wycena$/i,
  /^quote$/i,
  /^estimate$/i,
  /^realizacja(\s+usługi)?$/i,
  /^usługi$/i,
  /^services$/i,
  /^prace\s+główne$/i,
] as const;

export function normalizeSectionTitleForMatch(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isNarrativeSectionTitle(title: string): boolean {
  const normalized = normalizeSectionTitleForMatch(title);
  return NARRATIVE_SECTION_TITLE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isMetaSectionTitle(title: string): boolean {
  const normalized = normalizeSectionTitleForMatch(title);
  return META_SECTION_TITLE_PATTERNS.some((pattern) => pattern.test(normalized));
}
