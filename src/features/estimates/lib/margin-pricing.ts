import { roundEstimateDecimal } from "./estimate-decimals";

export function marginMultiplier(marginPercent: number): number {
  return 1 + marginPercent / 100;
}

/** Customer-facing unit price from base cost and project margin. */
export function unitPriceFromBase(
  baseUnitPrice: number,
  marginPercent: number,
): number {
  return roundEstimateDecimal(baseUnitPrice * marginMultiplier(marginPercent));
}

/** Derive base unit price from stored unit price and project margin. */
export function baseUnitPriceFromUnitPrice(
  unitPrice: number,
  marginPercent: number,
): number {
  const multiplier = marginMultiplier(marginPercent);
  const base = multiplier !== 0 ? unitPrice / multiplier : unitPrice;
  return roundEstimateDecimal(base);
}
