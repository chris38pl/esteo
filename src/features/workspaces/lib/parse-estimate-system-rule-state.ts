import {
  ESTIMATE_SYSTEM_RULE_IDS,
  type EstimateSystemRuleId,
  defaultEstimateSystemRuleState,
} from "@/features/workspaces/lib/estimate-system-rules";
import type { WorkspaceBranding } from "@/features/workspaces/schemas/branding";

export function parseEstimateSystemRuleState(
  branding: WorkspaceBranding | null | undefined,
): Record<EstimateSystemRuleId, boolean> {
  const defaults = defaultEstimateSystemRuleState();
  const stored = branding?.estimateSystemRules;

  if (!stored) {
    return defaults;
  }

  return ESTIMATE_SYSTEM_RULE_IDS.reduce(
    (acc, id) => {
      acc[id] = stored[id] ?? defaults[id];
      return acc;
    },
    { ...defaults },
  );
}
