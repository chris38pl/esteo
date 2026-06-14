import type { SubscriptionPlan } from "@prisma/client";

import { formatBytes } from "@/features/attachments/lib/format-bytes";
import type { PlanLimits } from "@/server/billing/plan-catalog";

export type PlanLimitLabels = {
  estimates: string;
  ai: string;
  users: string;
  storage: string;
  invites: string;
  undo: string;
};

function formatMonthlyLimit(value: number | null, unlimitedLabel: string): string {
  return value === null ? unlimitedLabel : String(value);
}

function formatUserLimit(limits: PlanLimits, unlimitedLabel: string): string {
  if (limits.maxInvitedSeats === null) {
    return unlimitedLabel;
  }
  return String(limits.maxInvitedSeats + 1);
}

export function formatPlanLimitLabels(
  limits: PlanLimits,
  unlimitedLabel: string,
): PlanLimitLabels {
  return {
    estimates: formatMonthlyLimit(limits.maxEstimatesPerMonth, unlimitedLabel),
    ai: formatMonthlyLimit(limits.maxAiAssistantCallsPerMonth, unlimitedLabel),
    users: formatUserLimit(limits, unlimitedLabel),
    storage: formatBytes(limits.maxStorageBytes),
    invites:
      limits.maxInvitedSeats === null
        ? unlimitedLabel
        : limits.maxInvitedSeats === 0
          ? "—"
          : String(limits.maxInvitedSeats),
    undo: String(limits.maxUndoSteps),
  };
}

export const PLAN_ORDER: SubscriptionPlan[] = ["FREE", "PRO", "BUSINESS"];
