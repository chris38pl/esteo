export const TEMPLATE_CURRENCY_LENGTH = 3;
export const ESTIMATE_TEMPLATE_ITEM_NOTE_MAX_LENGTH = 300;

/** Matches server-side Zod decimalStringSchema - used to gate autosave while typing. */
export const TEMPLATE_DECIMAL_PATTERN = /^\d+(\.\d{1,4})?$/;

export function normalizeTemplateDecimalInput(value: string): string {
  return value.trim().replace(",", ".");
}

export function isTemplateDecimalValue(value: string, required: boolean): boolean {
  const normalized = normalizeTemplateDecimalInput(value);
  if (!normalized) {
    return !required;
  }
  return TEMPLATE_DECIMAL_PATTERN.test(normalized);
}
