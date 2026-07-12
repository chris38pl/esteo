import type { EstimateAgentPatch } from "@/ai/schemas/estimate-agent-patch";

export type EditIntent =
  | "budget_target"
  | "budget_adjustment"
  | "profitability"
  | "scope"
  | "realism"
  | "general";

export type RecommendedStrategy =
  | "scope_first"
  | "margin_first"
  | "cost_driver_adjustment"
  | "quantity_correction"
  | "mixed";

export type EditConstraints = {
  maxSingleLinePriceIncreasePercent: number;
  preferAdditionsWhenTargetGapExceedsPercent: number;
  maxLinesToModifyForBudgetAdjustment: number;
  blockPriceOnlyWhenGapExceedsPercent: number;
};

export const DEFAULT_EDIT_CONSTRAINTS: EditConstraints = {
  maxSingleLinePriceIncreasePercent: 40,
  preferAdditionsWhenTargetGapExceedsPercent: 25,
  maxLinesToModifyForBudgetAdjustment: 5,
  blockPriceOnlyWhenGapExceedsPercent: 30,
};

export type EstimateVersionSnapshot = {
  marginPercent: number;
  sections: Array<{
    id: string;
    title: string;
    sortOrder: number;
    items: Array<{
      id: string;
      name: string;
      unit?: string | null;
      quantity: number;
      unitPrice: number;
      vatRate: number;
      sortOrder: number;
    }>;
  }>;
};

export type EstimateAgentContext = {
  currency: string;
  summary: {
    marginPercent: number;
    totalNet: number;
    totalVat: number;
    totalGross: number;
    costBasis: number;
    profit: number;
    lineItemCount: number;
    sectionCount: number;
  };
  sections: Array<{
    id: string;
    title: string;
    totalNet: number;
    totalGross: number;
    shareOfGrossPercent: number;
  }>;
  costDrivers: Array<{
    itemId: string;
    sectionTitle: string;
    name: string;
    lineNet: number;
    lineGross: number;
    shareOfGrossPercent: number;
  }>;
};

export type FinancialTarget = {
  kind: "gross" | "net";
  targetValue: number;
  currentValue: number;
  difference: number;
  changePercent: number;
};

export type CompactEstimateTree = {
  sections: Array<{
    id: string;
    title: string;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      unitPrice: number;
      unit: string | null;
    }>;
  }>;
};

export type AgentEditGuidance = {
  intent: EditIntent;
  financialTarget: FinancialTarget | null;
  recommendedStrategy: RecommendedStrategy;
  constraints: EditConstraints;
};

export type PatchSimulatedImpact = {
  before: { net: number; gross: number };
  after: { net: number; gross: number };
  difference: { net: number; gross: number };
};

export type PatchValidationWarningCode =
  | "unit_price_change_exceeds_limit"
  | "target_gross_missed"
  | "large_value_deleted"
  | "budget_price_only_large_gap"
  | "too_many_price_updates";

export type PatchValidationWarning = {
  code: PatchValidationWarningCode;
  params?: Record<string, string | number>;
  message?: string;
  itemId?: string;
};

export type ProposeEditResult = {
  patch: EstimateAgentPatch;
  guidance: AgentEditGuidance;
  simulatedImpact: PatchSimulatedImpact;
  warnings: PatchValidationWarning[];
};

export const COST_DRIVER_TOP_N = 8;
