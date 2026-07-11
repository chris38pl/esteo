"use client";

import type { ReactNode } from "react";

import type { FeatureState } from "@/server/permissions/domain";
import type { WorkspaceBillingReport } from "@/server/billing/dev-toolkit/report";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function formatNullable(value: string | null | undefined): string {
  return value && value.length > 0 ? value : "-";
}

function formatBoolean(value: boolean): string {
  return value ? "true" : "false";
}

function FeatureStateBadge({ state }: { state: FeatureState }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-md px-2 py-0.5 text-[11px] font-medium",
        state === "ACTIVE" &&
          "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
        state === "READ_ONLY" &&
          "border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300",
        state === "DISABLED" &&
          "border border-border/60 bg-muted/50 text-muted-foreground",
      )}
    >
      {state}
    </Badge>
  );
}

function ReportField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 border-b border-border/40 py-2.5 last:border-b-0 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className={mono ? "font-mono text-sm break-all" : "text-sm break-all"}>{value}</div>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold tracking-tight">{title}</h3>
      <div>{children}</div>
    </section>
  );
}

function formatReportDate(iso: string | null | undefined, locale: string): string {
  if (!iso) {
    return "-";
  }
  return new Date(iso).toLocaleDateString(locale, { dateStyle: "medium" });
}

export function WorkspaceBillingReportPanel({
  report,
  labels,
  locale,
}: {
  report: WorkspaceBillingReport;
  locale: string;
  labels: {
    sections: {
      overview: string;
      subscription: string;
      features: string;
      usage: string;
      stripe: string;
    };
    fields: {
      slug: string;
      owner: string;
      plan: string;
      planVersion: string;
      subscriptionStatus: string;
      effectiveStatus: string;
      provisioningStatus: string;
      isActiveFree: string;
      aiUsage: string;
      estimateUsage: string;
      seats: string;
      storage: string;
      stripeCustomerId: string;
      stripeSubscriptionId: string;
      cancelAtPeriodEnd: string;
      currentPeriodEnd: string;
      graceEndsAt: string;
    };
  };
}) {
  return (
    <div className="space-y-6">
      <ReportSection title={labels.sections.overview}>
        <ReportField label={labels.fields.slug} value={report.slug} mono />
        <ReportField label={labels.fields.owner} value={report.ownerEmail} />
        <ReportField label={labels.fields.plan} value={report.plan} />
        <ReportField label={labels.fields.planVersion} value={formatNullable(report.planVersion)} />
      </ReportSection>

      <ReportSection title={labels.sections.subscription}>
        <ReportField
          label={labels.fields.subscriptionStatus}
          value={formatNullable(report.subscriptionStatus)}
        />
        <ReportField label={labels.fields.effectiveStatus} value={report.effectiveStatus} />
        <ReportField label={labels.fields.provisioningStatus} value={report.provisioningStatus} />
        <ReportField
          label={labels.fields.isActiveFree}
          value={formatBoolean(report.isActiveFree)}
        />
        <ReportField
          label={labels.fields.cancelAtPeriodEnd}
          value={formatBoolean(report.cancelAtPeriodEnd)}
        />
        <ReportField
          label={labels.fields.currentPeriodEnd}
          value={formatReportDate(report.currentPeriodEnd, locale)}
        />
        <ReportField
          label={labels.fields.graceEndsAt}
          value={formatReportDate(report.graceEndsAt, locale)}
        />
      </ReportSection>

      <ReportSection title={labels.sections.features}>
        <div className="grid gap-2 sm:grid-cols-2">
          {report.features.map((feature) => (
            <div
              key={feature.label}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
            >
              <span className="text-sm font-medium">{feature.label}</span>
              <FeatureStateBadge state={feature.state} />
            </div>
          ))}
        </div>
      </ReportSection>

      <ReportSection title={labels.sections.usage}>
        <ReportField label={labels.fields.aiUsage} value={report.aiUsage} />
        <ReportField label={labels.fields.estimateUsage} value={report.estimateUsage} />
        <ReportField label={labels.fields.seats} value={report.seats} />
        <ReportField label={labels.fields.storage} value={report.storage} />
      </ReportSection>

      <ReportSection title={labels.sections.stripe}>
        <ReportField
          label={labels.fields.stripeCustomerId}
          value={formatNullable(report.stripeCustomerId)}
          mono
        />
        <ReportField
          label={labels.fields.stripeSubscriptionId}
          value={formatNullable(report.stripeSubscriptionId)}
          mono
        />
      </ReportSection>
    </div>
  );
}
