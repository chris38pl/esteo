import type { SubscriptionPlan } from "@prisma/client";

import type { ProrationKind } from "@/features/billing/lib/parse-invoice-preview-lines";
import type { AddonQuantities } from "@/features/billing/lib/subscription-impact";
import type { WorkspaceEntitlements } from "@/server/billing/entitlement-service";

export type ActiveSubscriptionChange = {
  id: string;
  type: "PLAN_DOWNGRADE";
  targetPlan: SubscriptionPlan;
  targetPlanVersion: string;
  effectiveAt: Date;
};

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

export type WorkspaceBillingPricing = {
  plan: SubscriptionPlan;
  planVersion: string | null;
  planCents: number;
  addonCents: number;
  recurringCents: number;
  currency: "PLN" | "EUR";

  nextInvoiceCents: number | null;
  prorationCents: number | null;
  invoiceDeltaCents: number | null;
  stripeRecurringCents: number | null;
  catalogPriceMismatch: boolean;
  nextInvoiceDate: string | null;
  prorationKind: ProrationKind | null;
};

export type WorkspaceBillingNextInvoice =
  | {
      kind: "invoice";
      amountCents: number;
      currency: "PLN" | "EUR";
      date: string;
      recurringCents: number;
      prorationCents: number;
      invoiceDeltaCents: number;
    }
  | {
      kind: "none";
      reason: "free_plan" | "canceling" | "no_subscription";
    };

export type WorkspaceBillingPageData = {
  entitlements: WorkspaceEntitlements;
  pricing: WorkspaceBillingPricing;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  memberUsage: WorkspaceBillingMemberUsage[];
  storage: WorkspaceBillingStorageUsage;
  storageOverLimit: boolean;
  seatOverLimit: boolean;
  nextInvoice: WorkspaceBillingNextInvoice;
  activeSubscriptionChange: ActiveSubscriptionChange | null;
  addonQuantities: AddonQuantities;
  canManageBilling: boolean;
  canChangePlanOrAddons: boolean;
  canPurchaseSubscription: boolean;
  canResumeSubscription: boolean;
  billingHandoffActive: boolean;
  billingOwnershipState: import("@/features/billing/lib/billing-permissions-logic").BillingOwnershipState;
};

export const PREVIEW_TTL_MS = 300_000;

export type BillingChangePreview = {
  recurringCents: number;
  prorationCents: number;
  invoiceDeltaCents: number;
  prorationKind: ProrationKind;
  nextInvoiceCents: number;
  currency: "PLN" | "EUR";
  previewGeneratedAt: string;
  previewExpiresAt: string;
};

export type BillingPlanChangePreviewInput = {
  kind: "plan";
  targetPlan: Exclude<SubscriptionPlan, "FREE">;
};

export type BillingAddonChangePreviewInput = {
  kind: "addons";
  storageQuantity: number;
  seatQuantity: number;
};

export type BillingChangePreviewInput =
  | BillingPlanChangePreviewInput
  | BillingAddonChangePreviewInput;
