import { buildEstimateAgentContext } from "../src/features/estimates/lib/build-estimate-agent-context";
import { buildAgentEditGuidance } from "../src/features/estimates/lib/build-agent-edit-guidance";
import { detectEditIntent } from "../src/features/estimates/lib/detect-edit-intent";
import { parseFinancialTarget } from "../src/features/estimates/lib/parse-financial-target";
import type { EstimateVersionSnapshot } from "../src/features/estimates/lib/estimate-agent-types";

const snapshot: EstimateVersionSnapshot = {
  marginPercent: 20,
  sections: [
    {
      id: "s1",
      title: "Prace",
      sortOrder: 0,
      items: [
        {
          id: "i1",
          name: "Test",
          quantity: 1,
          unitPrice: 20000,
          vatRate: 0.23,
          sortOrder: 0,
        },
      ],
    },
  ],
};

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const context = buildEstimateAgentContext(snapshot);
assert(context.summary.totalGross > 0, "context should compute gross");

const intent35 = detectEditIntent("ustaw na 35 000 brutto", "pl");
assert(intent35 === "budget_target", `expected budget_target, got ${intent35}`);

const target35 = parseFinancialTarget(
  "35 tys brutto",
  { gross: context.summary.totalGross, net: context.summary.totalNet },
  "budget_target",
);
assert(target35?.targetValue === 35000, `expected 35000, got ${target35?.targetValue}`);

const guidance35 = buildAgentEditGuidance("35 000 PLN brutto", context, "pl");
assert(
  guidance35.recommendedStrategy === "scope_first",
  `expected scope_first, got ${guidance35.recommendedStrategy}`,
);

const intentProfit = detectEditIntent("Zwiększ rentowność", "pl");
assert(intentProfit === "profitability", `expected profitability, got ${intentProfit}`);
const guidanceProfit = buildAgentEditGuidance("Zwiększ rentowność", context, "pl");
assert(
  guidanceProfit.recommendedStrategy === "margin_first",
  `expected margin_first, got ${guidanceProfit.recommendedStrategy}`,
);

const intentPct = detectEditIntent("Obniż o 10%", "pl");
assert(intentPct === "budget_adjustment", `expected budget_adjustment, got ${intentPct}`);
const guidancePct = buildAgentEditGuidance("Obniż o 10%", context, "pl");
assert(
  guidancePct.recommendedStrategy === "cost_driver_adjustment",
  `expected cost_driver_adjustment, got ${guidancePct.recommendedStrategy}`,
);

console.log("verify-estimate-agent-edit: ok");
