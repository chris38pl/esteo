import assert from "node:assert/strict";

import { formatPatchWarning } from "@/features/estimates/lib/format-patch-warning";
import type {
  AgentEditGuidance,
  EstimateVersionSnapshot,
  PatchSimulatedImpact,
} from "@/features/estimates/lib/estimate-agent-types";
import { DEFAULT_EDIT_CONSTRAINTS } from "@/features/estimates/lib/estimate-agent-types";
import { validateAgentPatch } from "@/features/estimates/lib/validate-agent-patch";

const snapshot: EstimateVersionSnapshot = {
  marginPercent: 20,
  sections: [
    {
      id: "section-1",
      title: "Sprzęt",
      sortOrder: 0,
      items: [
        {
          id: "item-1",
          name: "Narty klasy premium",
          unit: "szt.",
          quantity: 1,
          unitPrice: 2000,
          vatRate: 0.23,
          sortOrder: 0,
        },
      ],
    },
  ],
};

const guidance: AgentEditGuidance = {
  intent: "general",
  financialTarget: null,
  recommendedStrategy: "mixed",
  constraints: DEFAULT_EDIT_CONSTRAINTS,
};

const simulatedImpact: PatchSimulatedImpact = {
  before: { net: 2000, gross: 2460 },
  after: { net: 9000, gross: 11070 },
  difference: { net: 7000, gross: 8610 },
};

const warnings = validateAgentPatch({
  snapshot,
  patch: {
    updates: [{ itemId: "item-1", unitPrice: 9000 }],
    additions: [],
    newSections: [],
    deletions: [],
    reasoning: null,
  },
  guidance,
  simulatedImpact,
});

assert.equal(warnings.length, 1);
assert.equal(warnings[0]?.code, "unit_price_change_exceeds_limit");
assert.deepEqual(warnings[0]?.params, {
  itemName: "Narty klasy premium",
  limitPercent: 40,
  changePercent: 350,
});
assert.equal(warnings[0]?.message, undefined);

const translated = formatPatchWarning(
  warnings[0]!,
  (key, values) => `${key}:${values?.itemName}:${values?.changePercent}`,
  "pl",
);

assert.equal(
  translated,
  "ai.warnings.unit_price_change_exceeds_limit:Narty klasy premium:350",
);

console.log("validate-agent-patch.test.ts: ok");
