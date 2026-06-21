"use client";

import { useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";

import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import {
  ActivationCombinedBanner,
} from "@/features/activation/components/activation-combined-banner";
import { ActivationTipsBanner } from "@/features/activation/components/activation-tips-banner";
import { WorkspaceReadyBanner } from "@/features/activation/components/workspace-ready-banner";
import { useActivationUiState } from "@/features/activation/hooks/use-activation-ui-state";
import {
  ActivationAnalyticsEvents,
  trackActivationEvent,
} from "@/features/activation/lib/activation-analytics";
import { copyPublicFormLink } from "@/features/activation/lib/copy-public-form-link";
import {
  hasFirstEstimateAnalyticsFired,
  hasFirstPdfAnalyticsFired,
  hasPublicFormAnalyticsFired,
  markFirstEstimateAnalyticsFired,
  markFirstPdfAnalyticsFired,
  markPublicFormAnalyticsFired,
} from "@/features/activation/lib/activation-storage";
import { notifyFormLinkShared } from "@/features/activation/lib/notify-form-link-shared";
import type { ActivationProgressClient } from "@/features/activation/lib/activation-types";
import type { Locale } from "@/lib/locale";

interface ActivationEstimatesSectionProps {
  activationProgress: ActivationProgressClient;
  workspaceSlug: string;
  locale: Locale;
  onCreateClick: () => void;
}

export function ActivationEstimatesSection({
  activationProgress,
  workspaceSlug,
  locale,
  onCreateClick,
}: ActivationEstimatesSectionProps) {
  const tEstimates = useTranslations("estimates");
  const tFormBadge = useTranslations("activation.formBadge");
  const { currentUserId } = useWorkspaceContext();
  const {
    steps,
    isCelebrating,
    showChecklist,
    guideMode,
    isWorkspaceReadyBannerVisible,
    showTipsBanner,
    refreshActivationUi,
  } = useActivationUiState(activationProgress, workspaceSlug, currentUserId);

  useEffect(() => {
    if (!activationProgress.eligible) {
      return;
    }

    const createComplete = activationProgress.steps.find(
      (step) => step.id === "create_estimate",
    )?.completed;

    if (createComplete && !hasFirstEstimateAnalyticsFired(workspaceSlug)) {
      markFirstEstimateAnalyticsFired(workspaceSlug);
      trackActivationEvent(ActivationAnalyticsEvents.firstEstimateCreated, {
        workspaceSlug,
      });
    }

    const pdfComplete = activationProgress.steps.find(
      (step) => step.id === "generate_pdf",
    )?.completed;

    if (pdfComplete && !hasFirstPdfAnalyticsFired(workspaceSlug)) {
      markFirstPdfAnalyticsFired(workspaceSlug);
      trackActivationEvent(ActivationAnalyticsEvents.firstPdfGenerated, {
        workspaceSlug,
      });
    }

    if (
      activationProgress.hasPublicFormSubmission &&
      !hasPublicFormAnalyticsFired(workspaceSlug)
    ) {
      markPublicFormAnalyticsFired(workspaceSlug);
      trackActivationEvent(ActivationAnalyticsEvents.publicFormReceived, {
        workspaceSlug,
      });
    }
  }, [activationProgress, workspaceSlug]);

  const handleCopyFormLink = useCallback(async () => {
    const copied = await copyPublicFormLink(
      locale,
      workspaceSlug,
      tEstimates("list.hero.form.copyFallback"),
    );

    if (!copied) {
      return;
    }

    notifyFormLinkShared({
      workspaceSlug,
      title: tFormBadge("afterCopyTitle"),
      description: tFormBadge("afterCopyDescription"),
      onStateChange: refreshActivationUi,
    });
  }, [locale, refreshActivationUi, tEstimates, tFormBadge, workspaceSlug]);

  if (!activationProgress.eligible) {
    return null;
  }

  const checklistProps = {
    workspaceSlug,
    steps,
    isCelebrating,
    latestEstimateId: activationProgress.latestEstimateId,
    onCreateClick,
    onCopyFormLink: () => void handleCopyFormLink(),
    onCelebrationDismissed: refreshActivationUi,
  };

  return (
    <div className="space-y-4">
      {isWorkspaceReadyBannerVisible ? (
        <WorkspaceReadyBanner
          workspaceSlug={workspaceSlug}
          onDismissed={refreshActivationUi}
          onCreateClick={onCreateClick}
          onCopyFormLink={() => void handleCopyFormLink()}
        />
      ) : null}

      {showTipsBanner ? (
        <ActivationTipsBanner
          workspaceSlug={workspaceSlug}
          locale={locale}
          onDismissed={refreshActivationUi}
        />
      ) : guideMode === "how_it_works" ? (
        <ActivationCombinedBanner
          guideMode={guideMode}
          industry={activationProgress.industry}
          locale={locale}
          showChecklist={showChecklist}
          checklistProps={showChecklist ? checklistProps : undefined}
        />
      ) : null}
    </div>
  );
}
