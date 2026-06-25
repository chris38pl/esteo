export const PRICE_LIST_MAX_ITEMS = 200;
export const PRICE_LIST_NAME_MAX_LENGTH = 120;
export const PRICE_LIST_ITEM_NAME_MAX_LENGTH = 160;
export const PRICE_LIST_UNIT_MAX_LENGTH = 24;
export const PRICE_LIST_NOTE_MAX_LENGTH = 300;
export const PRICE_LIST_CURRENCY_LENGTH = 3;

/** Matches server-side Zod decimalStringSchema — used to gate autosave while typing. */
export const PRICE_LIST_DECIMAL_PATTERN = /^\d+(\.\d{1,4})?$/;

export function normalizePriceListDecimalInput(value: string): string {
  return value.trim().replace(",", ".");
}

export function isPriceListDecimalValue(value: string, required: boolean): boolean {
  const normalized = normalizePriceListDecimalInput(value);
  if (!normalized) {
    return !required;
  }
  return PRICE_LIST_DECIMAL_PATTERN.test(normalized);
}
