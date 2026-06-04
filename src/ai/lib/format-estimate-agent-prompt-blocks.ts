import type {
  AgentEditGuidance,
  CompactEstimateTree,
  EditIntent,
  EstimateAgentContext,
} from "@/features/estimates/lib/estimate-agent-types";

function jsonBlock(title: string, value: unknown): string {
  return `## ${title}\n${JSON.stringify(value, null, 2)}`;
}

export function formatFinancialSnapshotBlock(context: EstimateAgentContext): string {
  return jsonBlock("Financial Snapshot", {
    currency: context.currency,
    summary: context.summary,
    sections: context.sections,
    costDrivers: context.costDrivers,
  });
}

export function formatEditIntentBlock(intent: EditIntent): string {
  return jsonBlock("Edit Intent", { intent });
}

export function formatFinancialTargetBlock(
  guidance: AgentEditGuidance,
): string | null {
  if (!guidance.financialTarget) {
    return null;
  }
  return jsonBlock("Financial Target", guidance.financialTarget);
}

export function formatRecommendedStrategyBlock(
  guidance: AgentEditGuidance,
): string {
  const block = jsonBlock("Recommended strategy", {
    recommendedStrategy: guidance.recommendedStrategy,
  });
  return `${block}\n\nFollow this strategy unless the user request explicitly requires a different approach.`;
}

export function formatFinancialConstraintsBlock(
  guidance: AgentEditGuidance,
): string {
  return jsonBlock("Financial constraints", guidance.constraints);
}

export function formatEstimatorDecisionFrameworkBlock(): string {
  return [
    "## Estimator decision framework",
    "1. Budget / target requests: prefer scope additions and new sections when the gap is large; avoid inflating many unrelated unit prices.",
    "2. Profitability: adjust marginPercent and/or high-impact cost drivers before scattered price bumps.",
    "3. Scope / completeness: add missing work packages using workspace section titles and Scope Expansion Rules.",
    "4. Realism: correct quantities and market-aligned unit prices on cost drivers, not arbitrary markups.",
  ].join("\n");
}

function intentSpecificRules(intent: EditIntent, guidance: AgentEditGuidance): string {
  const c = guidance.constraints;
  const lines: string[] = ["## Intent-specific rules"];

  switch (intent) {
    case "budget_target":
    case "budget_adjustment":
      lines.push(
        `- Aim for the Financial Target (if set). Use additions/newSections when |changePercent| exceeds preferAdditionsWhenTargetGapExceedsPercent (${c.preferAdditionsWhenTargetGapExceedsPercent}%).`,
        `- Do not change more than maxLinesToModifyForBudgetAdjustment (${c.maxLinesToModifyForBudgetAdjustment}) line unit prices for budget adjustments unless scope additions are insufficient.`,
        `- Single-line unitPrice increases must stay within maxSingleLinePriceIncreasePercent (${c.maxSingleLinePriceIncreasePercent}%).`,
      );
      break;
    case "profitability":
      lines.push(
        "- Prefer marginPercent changes and targeted adjustments on cost drivers over many small price edits.",
        `- Respect maxSingleLinePriceIncreasePercent (${c.maxSingleLinePriceIncreasePercent}%) on any unitPrice update.`,
      );
      break;
    case "scope":
      lines.push(
        "- Add missing scope via additions and newSections; match existing section titles from the workspace.",
        "- Do not delete existing work unless the user explicitly asks.",
      );
      break;
    case "realism":
      lines.push(
        "- Adjust quantities and unit prices on cost drivers listed in the Financial Snapshot.",
        `- Keep unitPrice changes within maxSingleLinePriceIncreasePercent (${c.maxSingleLinePriceIncreasePercent}%).`,
      );
      break;
    default:
      lines.push(
        "- Make minimal, coherent changes aligned with the user request.",
        `- Respect maxSingleLinePriceIncreasePercent (${c.maxSingleLinePriceIncreasePercent}%).`,
      );
  }

  return lines.join("\n");
}

export function formatLargeChangeNoteBlock(
  guidance: AgentEditGuidance,
): string | null {
  const target = guidance.financialTarget;
  if (!target) {
    return null;
  }
  const threshold = guidance.constraints.blockPriceOnlyWhenGapExceedsPercent;
  if (Math.abs(target.changePercent) <= threshold) {
    return null;
  }
  return [
    "## Large change note",
    `The requested change is ~${Math.abs(target.changePercent)}% of current ${target.kind} total.`,
    `When |changePercent| exceeds blockPriceOnlyWhenGapExceedsPercent (${threshold}), do NOT rely on unitPrice-only updates — add scope (additions/newSections) and adjust margin only when appropriate.`,
  ].join("\n");
}

export function formatCompactEstimateTreeBlock(tree: CompactEstimateTree): string {
  return jsonBlock("Current estimate tree", tree);
}

export function formatOutputRulesBlock(locale: "pl" | "en"): string {
  const lang = locale === "pl" ? "Polish (pl)" : "English (en)";
  return [
    "## Output rules",
    `- Respond in language: ${lang}`,
    "- Return only a patch — do NOT return the full estimate.",
    "- Reference existing items by id when updating or deleting.",
    "- For additions, use sectionTitle matching existing section titles when possible.",
    "- Use empty arrays for additions, updates, deletions, and newSections when there are no changes.",
    "- In each update object, set name/unit/quantity/unitPrice/vatRate to null for fields that must not change.",
    "- For updates to existing items, only send changed fields; backend keeps existing vatRate when vatRate is null.",
    "- New line items MUST include vatRate (decimal fraction, default 0.23 if not specified).",
    "- Set unit to null on new line items when no unit applies.",
    "- Set marginPercent to null when the global margin should not change.",
    "- reasoning is REQUIRED: explain the approach and approximate gross impact after the patch.",
    "- Set vatRate as a decimal fraction (e.g. 0.23 for 23%).",
    "- Do not add unrelated line items.",
  ].join("\n");
}

export function formatIntentSpecificRulesBlock(
  guidance: AgentEditGuidance,
): string {
  return intentSpecificRules(guidance.intent, guidance);
}
