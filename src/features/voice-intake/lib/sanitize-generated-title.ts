const NULL_FRAGMENT = /\b(null|undefined)\b/gi;
const DANGLING_SEPARATOR = /[\s]*[-–-]\s*$/;

export function sanitizeGeneratedTitle(value: string | null | undefined): string {
  if (!value) return "";

  let result = value.trim();
  result = result.replace(NULL_FRAGMENT, "").replace(DANGLING_SEPARATOR, "").trim();
  result = result.replace(/\s{2,}/g, " ");

  return result;
}
