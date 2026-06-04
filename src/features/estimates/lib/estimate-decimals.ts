export const ESTIMATE_MAX_DECIMAL_PLACES = 2;

export function roundEstimateDecimal(value: number): number {
  const factor = 10 ** ESTIMATE_MAX_DECIMAL_PLACES;
  return Math.round(value * factor) / factor;
}

export function parseEstimateDecimalInput(raw: string): number {
  const num = parseFloat(raw);
  if (Number.isNaN(num)) return 0;
  return roundEstimateDecimal(num);
}
