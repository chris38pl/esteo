"use client";

import { DashboardChartsSection } from "@/features/dashboard/components/dashboard-charts-section";
import { DashboardOverduePaymentsListCard } from "@/features/dashboard/components/dashboard-overdue-payments-list-card";
import { DashboardRecentActivityCard } from "@/features/dashboard/components/dashboard-recent-activity-card";
import { DashboardRecentDocumentsCard } from "@/features/dashboard/components/dashboard-recent-documents-card";
import type { DashboardInsightsData } from "@/features/dashboard/lib/dashboard-overview-types";
import type { Locale } from "@/lib/locale";

interface DashboardInsightsSectionProps {
  data: DashboardInsightsData;
  workspaceSlug: string;
  locale: Locale;
}

export function DashboardInsightsSection({
  data,
  workspaceSlug,
  locale,
}: DashboardInsightsSectionProps) {
  return (
    <div className="space-y-4">
      <DashboardChartsSection
        data={data}
        workspaceSlug={workspaceSlug}
        locale={locale}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardRecentActivityCard
          items={data.recentActivity}
          workspaceSlug={workspaceSlug}
          locale={locale}
        />
        <DashboardRecentDocumentsCard
          items={data.recentDocuments}
          workspaceSlug={workspaceSlug}
          locale={locale}
        />
        <DashboardOverduePaymentsListCard
          items={data.overduePayments}
          workspaceSlug={workspaceSlug}
          locale={locale}
        />
      </div>
    </div>
  );
}
