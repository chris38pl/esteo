export const DEFAULT_MAX_DECIMAL_PLACES = 2;

export function roundDecimal(value: number, maxPlaces = DEFAULT_MAX_DECIMAL_PLACES): number {
  const factor = 10 ** maxPlaces;
  return Math.round(value * factor) / factor;
}

export function normalizeDecimalRaw(raw: string): string {
  return raw.replace(",", ".");
}

export function parseDecimalInput(raw: string, maxPlaces = DEFAULT_MAX_DECIMAL_PLACES): number {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "." || trimmed === ",") {
    return 0;
  }

  const num = Number.parseFloat(normalizeDecimalRaw(trimmed));
  if (Number.isNaN(num)) {
    return 0;
  }

  return roundDecimal(num, maxPlaces);
}

export function formatDecimalInputDisplay(
  value: number,
  options: { emptyZero?: boolean; maxPlaces?: number } = {},
): string {
  const { emptyZero = true, maxPlaces = DEFAULT_MAX_DECIMAL_PLACES } = options;

  if (emptyZero && value === 0) {
    return "";
  }

  return String(roundDecimal(value, maxPlaces));
}

export function isValidDecimalDraft(raw: string): boolean {
  return raw === "" || /^\d*[,.]?\d*$/.test(raw);
}

export function formatPercentInputDisplay(
  valueFraction: number,
  options: { emptyZero?: boolean } = {},
): string {
  const { emptyZero = true } = options;
  const percent = roundDecimal(valueFraction * 100, 0);

  if (emptyZero && percent === 0) {
    return "";
  }

  return String(percent);
}

export function parsePercentInput(raw: string): number {
  return parseDecimalInput(raw, 0) / 100;
}
