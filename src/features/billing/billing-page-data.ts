import type { WorkspaceEntitlements } from "@/server/billing/entitlement-service";

export type WorkspaceBillingMemberUsage = {
  userId: string;
  name: string | null;
  email: string;
  aiCalls: number;
  estimates: number;
};

export type WorkspaceBillingStorageUsage = {
  usedFormatted: string;
  limitFormatted: string;
  usedPercent: number;
};

export type WorkspaceBillingNextInvoice =
  | {
      kind: "invoice";
      amountCents: number;
      currency: "PLN" | "EUR";
      date: string;
    }
  | {
      kind: "none";
      reason: "free_plan" | "canceling" | "no_subscription";
    };

export type WorkspaceBillingPageData = {
  entitlements: WorkspaceEntitlements;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  memberUsage: WorkspaceBillingMemberUsage[];
  storage: WorkspaceBillingStorageUsage;
  storageOverLimit: boolean;
  seatOverLimit: boolean;
  nextInvoice: WorkspaceBillingNextInvoice;
  canManageBilling: boolean;
  billingHandoffActive: boolean;
};
