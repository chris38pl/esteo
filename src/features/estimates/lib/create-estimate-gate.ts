import type { EstimateProcessingGateReason } from "@/server/billing/entitlement-service";

export type CreateEstimateGate = {
  allowed: boolean;
  reason?: EstimateProcessingGateReason;
  estimatesThisMonth: number;
  maxEstimatesPerMonth: number | null;
};
