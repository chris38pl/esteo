"use client";

import { useTranslations } from "next-intl";

import { WorkspaceSettingsCard } from "@/features/workspaces/components/workspace-settings-card";
import { WorkspaceSettingsDeleteSection } from "@/features/workspaces/components/workspace-settings-delete-section";
import { WorkspaceSettingsTransferSection } from "@/features/workspaces/components/workspace-settings-transfer-section";
import type {
  PendingOutboundTransferView,
  TransferEligibilityView,
} from "@/features/workspaces/components/transfer-types";
import type { WorkspaceDeleteEligibility } from "@/features/workspaces/lib/workspace-delete-eligibility";
import type { Locale } from "@/lib/locale";

export function WorkspaceSettingsManagementCard({
  workspaceId,
  workspaceName,
  workspaceSlug,
  locale,
  transferEligibility,
  pendingTransfer,
  deleteEligibility,
}: {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  locale: Locale;
  transferEligibility: TransferEligibilityView;
  pendingTransfer: PendingOutboundTransferView | null;
  deleteEligibility: WorkspaceDeleteEligibility;
}) {
  const t = useTranslations("workspaces.settings");

  return (
    <WorkspaceSettingsCard title={t("management.title")} className="mb-8">
      <WorkspaceSettingsTransferSection
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        workspaceSlug={workspaceSlug}
        eligibility={transferEligibility}
        pendingTransfer={pendingTransfer}
        locale={locale}
        embedded
      />

      <div className="border-t border-border/60 pt-6">
        <WorkspaceSettingsDeleteSection
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          locale={locale}
          workspaceSlug={workspaceSlug}
          deleteEligibility={deleteEligibility}
          currentPeriodEnd={transferEligibility.currentPeriodEnd}
          embedded
        />
      </div>
    </WorkspaceSettingsCard>
  );
}
