import type { EstimateAgentPatch } from "@/ai/schemas/estimate-agent-patch";
import type {
  AgentEditGuidance,
  EditConstraints,
  EstimateVersionSnapshot,
  PatchSimulatedImpact,
  PatchValidationWarning,
} from "@/features/estimates/lib/estimate-agent-types";

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
        params: {
          itemName: existing.name,
          limitPercent: constraints.maxSingleLinePriceIncreasePercent,
          changePercent: Math.round(changePercent),
        },
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
        params: {
          afterGross,
          targetGross: target.targetValue,
          currency,
        },
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
      params: {
        deletedPercent: Math.round((deletedGross / beforeGross) * 100),
      },
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
    });
  }

  const priceUpdates = patch.updates.filter((u) => u.unitPrice != null);
  if (
    (guidance.intent === "budget_target" || guidance.intent === "budget_adjustment") &&
    priceUpdates.length > constraints.maxLinesToModifyForBudgetAdjustment
  ) {
    warnings.push({
      code: "too_many_price_updates",
      params: {
        count: priceUpdates.length,
        limit: constraints.maxLinesToModifyForBudgetAdjustment,
      },
    });
  }

  return warnings;
}
