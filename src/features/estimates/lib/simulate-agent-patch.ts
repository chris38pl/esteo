import type { EstimateAgentPatch } from "@/ai/schemas/estimate-agent-patch";
import { applyPatchToSnapshot } from "@/features/estimates/lib/apply-patch-to-snapshot";
import { buildEstimateAgentContext } from "@/features/estimates/lib/build-estimate-agent-context";
import type {
  EstimateVersionSnapshot,
  PatchSimulatedImpact,
} from "@/features/estimates/lib/estimate-agent-types";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function simulateAgentPatch(
  snapshot: EstimateVersionSnapshot,
  patch: EstimateAgentPatch,
  currency = "PLN",
): PatchSimulatedImpact {
  const beforeContext = buildEstimateAgentContext(snapshot, currency);
  const afterSnapshot = applyPatchToSnapshot(snapshot, patch);
  const afterContext = buildEstimateAgentContext(afterSnapshot, currency);

  const before = {
    net: beforeContext.summary.totalNet,
    gross: beforeContext.summary.totalGross,
  };
  const after = {
    net: afterContext.summary.totalNet,
    gross: afterContext.summary.totalGross,
  };

  return {
    before,
    after,
    difference: {
      net: roundMoney(after.net - before.net),
      gross: roundMoney(after.gross - before.gross),
    },
  };
}
