import type { EstimateAgentPatch } from "@/ai/schemas/estimate-agent-patch";
import type {
  AgentEditGuidance,
  EditConstraints,
  EstimateVersionSnapshot,
  PatchSimulatedImpact,
  PatchValidationWarning,
} from "@/features/estimates/lib/estimate-agent-types";

function formatMoney(value: number, currency: string): string {
  return `${value.toLocaleString("pl-PL", { maximumFractionDigits: 0 })} ${currency}`;
}

export function validateAgentPatch(input: {
  snapshot: EstimateVersionSnapshot;
  patch: EstimateAgentPatch;
  guidance: AgentEditGuidance;
  simulatedImpact: PatchSimulatedImpact;
  currency?: string;
}): PatchValidationWarning[] {
  const warnings: PatchValidationWarning[] = [];
  const { patch, guidance, simulatedImpact } = input;
  const constraints: EditConstraints = guidance.constraints;
  const currency = input.currency ?? "PLN";

  const itemById = new Map(
    input.snapshot.sections.flatMap((section) =>
      section.items.map((item) => [item.id, item] as const),
    ),
  );

  for (const u of patch.updates) {
    if (u.unitPrice == null) {
      continue;
    }
    const existing = itemById.get(u.itemId);
    if (!existing || existing.unitPrice === 0) {
      continue;
    }
    const changePercent =
      ((u.unitPrice - existing.unitPrice) / existing.unitPrice) * 100;
    if (changePercent > constraints.maxSingleLinePriceIncreasePercent) {
      warnings.push({
        code: "unit_price_change_exceeds_limit",
        message: `Unit price increase on "${existing.name}" exceeds ${constraints.maxSingleLinePriceIncreasePercent}% (+${Math.round(changePercent)}%).`,
        itemId: u.itemId,
      });
    }
  }

  const target = guidance.financialTarget;
  if (target?.kind === "gross") {
    const afterGross = simulatedImpact.after.gross;
    const missPercent =
      target.targetValue !== 0
        ? (Math.abs(afterGross - target.targetValue) / target.targetValue) * 100
        : 0;
    if (missPercent > 15) {
      warnings.push({
        code: "target_gross_missed",
        message: `Simulated gross (${formatMoney(afterGross, currency)}) is more than 15% away from target (${formatMoney(target.targetValue, currency)}).`,
      });
    }
  }

  const beforeGross = simulatedImpact.before.gross;
  const deletedGross = patch.deletions.reduce((sum, itemId) => {
    const item = itemById.get(itemId);
    if (!item) {
      return sum;
    }
    const lineGross = item.quantity * item.unitPrice * (1 + item.vatRate);
    return sum + lineGross;
  }, 0);

  if (beforeGross > 0 && deletedGross / beforeGross > 0.2) {
    warnings.push({
      code: "large_value_deleted",
      message: `Deletions remove about ${Math.round((deletedGross / beforeGross) * 100)}% of gross value.`,
    });
  }

  if (
    (guidance.intent === "budget_target" || guidance.intent === "budget_adjustment") &&
    target &&
    Math.abs(target.changePercent) >
      constraints.preferAdditionsWhenTargetGapExceedsPercent &&
    patch.additions.length === 0 &&
    patch.newSections.length === 0 &&
    patch.updates.length > 0
  ) {
    warnings.push({
      code: "budget_price_only_large_gap",
      message:
        "Large budget gap but patch only updates existing lines - consider scope additions.",
    });
  }

  const priceUpdates = patch.updates.filter((u) => u.unitPrice != null);
  if (
    (guidance.intent === "budget_target" || guidance.intent === "budget_adjustment") &&
    priceUpdates.length > constraints.maxLinesToModifyForBudgetAdjustment
  ) {
    warnings.push({
      code: "too_many_price_updates",
      message: `Budget adjustment changes unit prices on ${priceUpdates.length} lines (limit ${constraints.maxLinesToModifyForBudgetAdjustment}).`,
    });
  }

  return warnings;
}
