import {
  calculateEstimate,
  calculateLineItem,
  type LineItemCalcInput,
} from "@/features/estimates/lib/calculate-estimate";
import {
  COST_DRIVER_TOP_N,
  type EstimateAgentContext,
  type EstimateVersionSnapshot,
} from "@/features/estimates/lib/estimate-agent-types";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

export function buildEstimateAgentContext(
  snapshot: EstimateVersionSnapshot,
  currency = "PLN",
): EstimateAgentContext {
  const flatItems: Array<
    LineItemCalcInput & {
      itemId: string;
      sectionId: string;
      sectionTitle: string;
      name: string;
      lineNet: number;
      lineGross: number;
    }
  > = [];

  for (const section of snapshot.sections) {
    for (const item of section.items) {
      const calc = calculateLineItem({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
      });
      flatItems.push({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        itemId: item.id,
        sectionId: section.id,
        sectionTitle: section.title,
        name: item.name,
        lineNet: calc.netValue,
        lineGross: calc.grossValue,
      });
    }
  }

  const estimateTotals = calculateEstimate(
    flatItems.map(({ quantity, unitPrice, vatRate }) => ({
      quantity,
      unitPrice,
      vatRate,
    })),
    snapshot.marginPercent,
  );

  const totalGross = estimateTotals.totalGross;

  const sectionMap = new Map<
    string,
    { id: string; title: string; totalNet: number; totalGross: number }
  >();

  for (const item of flatItems) {
    const existing = sectionMap.get(item.sectionId) ?? {
      id: item.sectionId,
      title: item.sectionTitle,
      totalNet: 0,
      totalGross: 0,
    };
    existing.totalNet += item.lineNet;
    existing.totalGross += item.lineGross;
    sectionMap.set(item.sectionId, existing);
  }

  const sections = [...sectionMap.values()]
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((section) => ({
      id: section.id,
      title: section.title,
      totalNet: roundMoney(section.totalNet),
      totalGross: roundMoney(section.totalGross),
      shareOfGrossPercent:
        totalGross > 0
          ? roundPercent((section.totalGross / totalGross) * 100)
          : 0,
    }));

  const costDrivers = [...flatItems]
    .sort((a, b) => b.lineGross - a.lineGross)
    .slice(0, COST_DRIVER_TOP_N)
    .map((item) => ({
      itemId: item.itemId,
      sectionTitle: item.sectionTitle,
      name: item.name,
      lineNet: roundMoney(item.lineNet),
      lineGross: roundMoney(item.lineGross),
      shareOfGrossPercent:
        totalGross > 0
          ? roundPercent((item.lineGross / totalGross) * 100)
          : 0,
    }));

  return {
    currency,
    summary: {
      marginPercent: snapshot.marginPercent,
      totalNet: roundMoney(estimateTotals.totalNet),
      totalVat: roundMoney(estimateTotals.totalVat),
      totalGross: roundMoney(estimateTotals.totalGross),
      costBasis: roundMoney(estimateTotals.costBasis),
      profit: roundMoney(estimateTotals.profit),
      lineItemCount: flatItems.length,
      sectionCount: sections.length,
    },
    sections,
    costDrivers,
  };
}
