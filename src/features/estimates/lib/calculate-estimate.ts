export interface LineItemCalcInput {
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export interface LineItemResult {
  netValue: number;
  vatAmount: number;
  grossValue: number;
}

export interface EstimateCalcResult {
  totalNet: number;
  totalVat: number;
  totalGross: number;
  /** Cost before margin: totalNet / (1 + marginPercent / 100) */
  costBasis: number;
  /** Profit earned via margin: totalNet - costBasis */
  profit: number;
  /** Cost as fraction of net revenue: costBasis / totalNet (0 when no revenue) */
  costRatio: number;
  /** Profit as % of net revenue — user-facing profitability metric */
  profitMarginOnNetPercent: number;
}

export function calculateLineItem(item: LineItemCalcInput): LineItemResult {
  const netValue = item.quantity * item.unitPrice;
  const vatAmount = netValue * item.vatRate;
  const grossValue = netValue + vatAmount;
  return { netValue, vatAmount, grossValue };
}

export function calculateEstimate(
  items: LineItemCalcInput[],
  marginPercent: number,
): EstimateCalcResult {
  let totalNet = 0;
  let totalVat = 0;
  let totalGross = 0;

  for (const item of items) {
    const result = calculateLineItem(item);
    totalNet += result.netValue;
    totalVat += result.vatAmount;
    totalGross += result.grossValue;
  }

  const divisor = 1 + marginPercent / 100;
  const costBasis = divisor !== 0 ? totalNet / divisor : 0;
  const profit = totalNet - costBasis;
  const costRatio = totalNet !== 0 ? costBasis / totalNet : 0;
  const profitMarginOnNetPercent = totalNet !== 0 ? (profit / totalNet) * 100 : 0;

  return {
    totalNet,
    totalVat,
    totalGross,
    costBasis,
    profit,
    costRatio,
    profitMarginOnNetPercent,
  };
}
