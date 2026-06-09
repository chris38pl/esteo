"use client";

import type { EstimateAttachmentClient } from "@/features/attachments/lib/serialize-attachments";
import type { EstimateEditorTabId } from "@/features/estimates/components/estimate-editor-tabs";
import type { EstimateForEditorClient, VersionTreeClient } from "@/features/estimates/lib/serialize-estimate";
import type { EstimateActivityLogClient } from "@/features/estimates/lib/serialize-estimate-activity";
import type { PaymentInstallmentClient } from "@/features/estimates/lib/serialize-payment-installments";
import type { Currency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

import { EstimateSummaryAiCard } from "./estimate-summary-ai-card";
import { EstimateSummaryBriefCard } from "./estimate-summary-brief-card";
import { EstimateSummaryPaymentsCard } from "./estimate-summary-payments-card";
import { EstimateSummaryRecommendationsCard } from "./estimate-summary-recommendations-card";
import { EstimateSummaryScopeCard } from "./estimate-summary-scope-card";
import { EstimateSummaryVersionChangesCard } from "./estimate-summary-version-changes-card";
import { EstimateSummaryVersionsCard } from "./estimate-summary-versions-card";
import { EstimateSummaryWorkflowStatusCard } from "./estimate-summary-workflow-status-card";

interface EstimateSummaryPanelProps {
  estimate: EstimateForEditorClient;
  versionTree: VersionTreeClient | null;
  activeVersionId: string | null;
  activityLogs: EstimateActivityLogClient[];
  workspaceSlug: string;
  locale: Locale;
  currency: Currency;
  customerTotalGross: number;
  installments: PaymentInstallmentClient[];
  attachments: EstimateAttachmentClient[];
  onOpenTab?: (tab: EstimateEditorTabId) => void;
}

export function EstimateSummaryPanel({
  estimate,
  versionTree,
  activeVersionId,
  activityLogs,
  workspaceSlug,
  locale,
  currency,
  customerTotalGross,
  installments,
  attachments,
  onOpenTab,
}: EstimateSummaryPanelProps) {
  const resolvedActiveVersionId =
    activeVersionId ?? estimate.latestVersionId ?? estimate.versions[0]?.id ?? "";

  const showVersionChanges =
    estimate.versions.length >= 2 && Boolean(resolvedActiveVersionId);

  return (
    <div className="w-full px-4 py-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <EstimateSummaryVersionsCard
          estimate={estimate}
          activeVersionId={resolvedActiveVersionId}
          workspaceSlug={workspaceSlug}
          locale={locale}
        />

        {showVersionChanges ? (
          <EstimateSummaryVersionChangesCard
            key={resolvedActiveVersionId}
            estimate={estimate}
            activeVersionId={resolvedActiveVersionId}
            locale={locale}
          />
        ) : null}

        <EstimateSummaryWorkflowStatusCard
          estimate={estimate}
          versionTree={versionTree}
          activityLogs={activityLogs}
          locale={locale}
        />

        <EstimateSummaryScopeCard versionTree={versionTree} />
        <EstimateSummaryPaymentsCard
          locale={locale}
          currency={currency}
          customerTotalGross={customerTotalGross}
          installments={installments}
        />
        <div
          className={cn(
            !showVersionChanges && "lg:col-span-2 xl:col-span-2",
          )}
        >
          <EstimateSummaryRecommendationsCard
            installments={installments}
            attachments={attachments}
            onOpenTab={onOpenTab}
            wide={!showVersionChanges}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EstimateSummaryBriefCard
          estimate={estimate}
          attachments={attachments}
          locale={locale}
        />
        <EstimateSummaryAiCard />
      </div>
    </div>
  );
}
