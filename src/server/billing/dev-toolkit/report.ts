import type { Feature, FeatureState } from "@/server/permissions/domain";

/** Display order for the Features section in workspace-state report. */
export const FEATURE_REPORT_ORDER: ReadonlyArray<{
  label: string;
  feature: Feature;
}> = [
  { label: "AI", feature: "AI_ASSISTANT" },
  { label: "ESTIMATES", feature: "ESTIMATES" },
  { label: "PDF", feature: "PDF" },
  { label: "INVITES", feature: "INVITES" },
  { label: "STORAGE", feature: "STORAGE" },
  { label: "CLIENT_PORTAL", feature: "CLIENT_PORTAL" },
];

export type WorkspaceBillingReport = {
  slug: string;
  ownerEmail: string;
  plan: string;
  planVersion: string | null;
  subscriptionStatus: string | null;
  effectiveStatus: string;
  provisioningStatus: string;
  isActiveFree: boolean;
  features: Array<{ label: string; state: FeatureState }>;
  aiUsage: string;
  estimateUsage: string;
  seats: string;
  storage: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  graceEndsAt: string | null;
};

function formatLimit(used: number, limit: number | null): string {
  return limit === null ? `${used} / unlimited` : `${used} / ${limit}`;
}

function formatNullableDate(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export async function buildWorkspaceBillingReport(slug: string): Promise<WorkspaceBillingReport> {
  const { loadWorkspaceBySlug } = await import("@/server/billing/dev-toolkit/load-workspace");
  const { getWorkspaceEntitlements, getFeatureState } = await import(
    "@/server/billing/entitlement-service"
  );
  const { formatBytes } = await import("@/features/attachments/lib/format-bytes");

  const workspace = await loadWorkspaceBySlug(slug);
  const entitlements = await getWorkspaceEntitlements(workspace.id);

  const features = await Promise.all(
    FEATURE_REPORT_ORDER.map(async ({ label, feature }) => ({
      label,
      state: await getFeatureState(workspace.id, feature),
    })),
  );

  return {
    slug: workspace.slug,
    ownerEmail: workspace.ownerEmail,
    plan: entitlements.plan,
    planVersion: entitlements.planVersion,
    subscriptionStatus: workspace.subscription?.status ?? null,
    effectiveStatus: entitlements.effectiveStatus,
    provisioningStatus: workspace.provisioningStatus,
    isActiveFree: workspace.isActiveFree,
    features,
    aiUsage: formatLimit(
      entitlements.usage.aiCallsThisMonth,
      entitlements.limits.maxAiAssistantCallsPerMonth,
    ),
    estimateUsage: formatLimit(
      entitlements.usage.estimatesThisMonth,
      entitlements.limits.maxEstimatesPerMonth,
    ),
    seats: formatLimit(
      entitlements.seats.used + entitlements.seats.reserved,
      entitlements.seats.limit,
    ),
    storage: `${formatBytes(workspace.attachmentStorageUsedBytes)} / ${formatBytes(workspace.attachmentStorageLimitBytes)}`,
    stripeCustomerId: workspace.stripeCustomerId,
    stripeSubscriptionId: workspace.subscription?.stripeSubscriptionId ?? null,
    cancelAtPeriodEnd: workspace.subscription?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: formatNullableDate(workspace.subscription?.currentPeriodEnd ?? null),
    graceEndsAt: formatNullableDate(workspace.subscription?.graceEndsAt ?? null),
  };
}

export function formatWorkspaceBillingReport(report: WorkspaceBillingReport): string {
  const featureLines = report.features.map((f) => `${f.label}=${f.state}`).join("\n");

  return [
    "Workspace:",
    report.slug,
    "",
    "Owner:",
    report.ownerEmail,
    "",
    "Plan:",
    report.plan,
    "",
    "Plan Version:",
    report.planVersion ?? "—",
    "",
    "Subscription Status:",
    report.subscriptionStatus ?? "—",
    "",
    "Effective Status:",
    report.effectiveStatus,
    "",
    "Provisioning Status:",
    report.provisioningStatus,
    "",
    "isActiveFree:",
    String(report.isActiveFree),
    "",
    "Features:",
    featureLines,
    "",
    "AI Usage:",
    report.aiUsage,
    "",
    "Estimate Usage:",
    report.estimateUsage,
    "",
    "Seats:",
    report.seats,
    "",
    "Storage:",
    report.storage,
    "",
    "Stripe Customer:",
    report.stripeCustomerId ?? "—",
    "",
    "Stripe Subscription:",
    report.stripeSubscriptionId ?? "—",
    "",
    "Cancel At Period End:",
    String(report.cancelAtPeriodEnd),
    "",
    "Current Period End:",
    report.currentPeriodEnd ?? "null",
    "",
    "Grace Ends At:",
    report.graceEndsAt ?? "null",
  ].join("\n");
}
