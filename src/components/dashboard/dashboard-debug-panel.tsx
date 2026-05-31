import type { ReactNode } from "react";

import type { DashboardDebugData } from "@/features/dashboard/server/get-dashboard-debug-data";
import { formatWorkspaceIndustry } from "@/features/workspaces/lib/industries";
import { getServerTranslations } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";

function formatValue(value: unknown, locale: Locale): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (value instanceof Date) {
    return value.toLocaleString(locale === "pl" ? "pl-PL" : "en-US");
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function DebugField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 border-b border-border/40 py-2.5 last:border-b-0 sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className={mono ? "font-mono text-sm break-all" : "text-sm break-all"}>{value}</div>
    </div>
  );
}

function DebugSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="surface-card p-6">
      <h2 className="mb-4 text-base font-semibold tracking-tight">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

export async function DashboardDebugPanel({
  data,
  locale,
}: {
  data: DashboardDebugData;
  locale: Locale;
}) {
  const t = await getServerTranslations(locale, "dashboard");
  const { user, activeWorkspaceId, billingAccount, workspaces } = data;
  const subscription = billingAccount?.subscription ?? null;
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId);

  return (
    <div className="space-y-6">
      <DebugSection title={t("sections.user")}>
        <DebugField label={t("fields.userId")} value={user.id} mono />
        <DebugField label={t("fields.clerkId")} value={user.clerkId} mono />
        <DebugField label={t("fields.email")} value={user.email} />
        <DebugField label={t("fields.name")} value={formatValue(user.name, locale)} />
        <DebugField label={t("fields.avatarUrl")} value={formatValue(user.avatarUrl, locale)} mono />
        <DebugField label={t("fields.platformRole")} value={user.platformRole} />
        <DebugField
          label={t("fields.lastActiveWorkspaceId")}
          value={formatValue(user.lastActiveWorkspaceId, locale)}
          mono
        />
        <DebugField label={t("fields.createdAt")} value={formatValue(user.createdAt, locale)} />
        <DebugField label={t("fields.updatedAt")} value={formatValue(user.updatedAt, locale)} />
      </DebugSection>

      <DebugSection title={t("sections.billing")}>
        <DebugField
          label={t("fields.billingAccountId")}
          value={formatValue(billingAccount?.id, locale)}
          mono
        />
        <DebugField
          label={t("fields.stripeCustomerId")}
          value={formatValue(billingAccount?.stripeCustomerId, locale)}
          mono
        />
        <DebugField
          label={t("fields.subscriptionPlan")}
          value={formatValue(subscription?.plan, locale)}
        />
        <DebugField
          label={t("fields.subscriptionStatus")}
          value={formatValue(subscription?.status, locale)}
        />
        <DebugField
          label={t("fields.subscriptionId")}
          value={formatValue(subscription?.id, locale)}
          mono
        />
        <DebugField
          label={t("fields.stripeSubscriptionId")}
          value={formatValue(subscription?.stripeSubscriptionId, locale)}
          mono
        />
        <DebugField
          label={t("fields.currentPeriodEnd")}
          value={formatValue(subscription?.currentPeriodEnd, locale)}
        />
      </DebugSection>

      <DebugSection title={t("sections.activeWorkspace")}>
        <DebugField
          label={t("fields.resolvedActiveWorkspaceId")}
          value={formatValue(activeWorkspaceId, locale)}
          mono
        />
        <DebugField
          label={t("fields.activeWorkspaceName")}
          value={formatValue(activeWorkspace?.name, locale)}
        />
        <DebugField
          label={t("fields.activeWorkspaceSlug")}
          value={formatValue(activeWorkspace?.slug, locale)}
          mono
        />
      </DebugSection>

      <DebugSection title={t("sections.workspaces", { count: workspaces.length })}>
        {workspaces.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty.workspaces")}</p>
        ) : (
          <div className="space-y-6">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="rounded-lg border border-border/60 bg-muted/20 p-4"
              >
                <p className="mb-3 text-sm font-medium">
                  {workspace.name}
                  {workspace.id === activeWorkspaceId ? (
                    <span className="ml-2 text-xs font-normal text-primary">
                      ({t("labels.active")})
                    </span>
                  ) : null}
                </p>
                <DebugField label={t("fields.workspaceId")} value={workspace.id} mono />
                <DebugField label={t("fields.workspaceSlug")} value={workspace.slug} mono />
                <DebugField label={t("fields.workspaceName")} value={workspace.name} />
                <DebugField
                  label={t("fields.workspaceIndustry")}
                  value={formatValue(
                    formatWorkspaceIndustry(workspace.industry, workspace.industryOtherText),
                    locale,
                  )}
                />
                <DebugField
                  label={t("fields.workspaceIndustryEnum")}
                  value={formatValue(workspace.industry, locale)}
                />
                <DebugField label={t("fields.workspaceDefaultLocale")} value={workspace.defaultLocale} />
                <DebugField
                  label={t("fields.workspaceAppearanceTheme")}
                  value={formatValue(workspace.appearanceTheme, locale)}
                />
                <DebugField label={t("fields.workspaceOwnerId")} value={workspace.ownerId} mono />
                <DebugField
                  label={t("fields.workspaceBillingAccountId")}
                  value={workspace.billingAccountId}
                  mono
                />
                <DebugField label={t("fields.accessRole")} value={workspace.accessRole} />
                <DebugField label={t("fields.isOwner")} value={formatValue(workspace.isOwner, locale)} />
                <DebugField
                  label={t("fields.membershipId")}
                  value={formatValue(workspace.membership?.id, locale)}
                  mono
                />
                <DebugField
                  label={t("fields.membershipRole")}
                  value={formatValue(workspace.membership?.role, locale)}
                />
                <DebugField
                  label={t("fields.workspaceCreatedAt")}
                  value={formatValue(workspace.createdAt, locale)}
                />
                <DebugField
                  label={t("fields.workspaceUpdatedAt")}
                  value={formatValue(workspace.updatedAt, locale)}
                />
              </div>
            ))}
          </div>
        )}
      </DebugSection>
    </div>
  );
}
