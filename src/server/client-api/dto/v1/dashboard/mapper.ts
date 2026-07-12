import type { DashboardSummary } from "@/server/client-api/dto/v1/dashboard/dto";
import type { WorkspaceRef } from "@/server/client-api/dto/v1/workspace/dto";

type HorizonMetric = { value: number };
type IncomeMetric = { value: number; currency: string };

export type DashboardSummaryInput = {
  greetingName: string;
  workspace: WorkspaceRef;
  stats: {
    byHorizon: {
      all: {
        estimates: HorizonMetric;
        sent: HorizonMetric;
        income: IncomeMetric;
      };
    };
    overdue: { amount: number; count: number; currency: string };
  };
};

/** Pure: dashboard KPI stats (horizon "all") -> DashboardSummary DTO. */
export function toDashboardSummary(input: DashboardSummaryInput): DashboardSummary {
  const horizon = input.stats.byHorizon.all;
  return {
    greetingName: input.greetingName,
    workspace: input.workspace,
    kpis: {
      estimates: horizon.estimates.value,
      sent: horizon.sent.value,
      income: horizon.income.value,
      currency: horizon.income.currency,
    },
    overdue: {
      amount: input.stats.overdue.amount,
      count: input.stats.overdue.count,
      currency: input.stats.overdue.currency,
    },
  };
}
