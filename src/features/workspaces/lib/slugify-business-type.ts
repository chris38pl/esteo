/**
 * Mechanical slug for business type analytics - no synonym grouping in MVP.
 * "Fotograf ślubny" and "Fotografia ślubna" produce different slugs intentionally.
 */
export function slugifyBusinessType(value: string): string {
  return removeDiacritics(value.trim().toLowerCase())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function removeDiacritics(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}
