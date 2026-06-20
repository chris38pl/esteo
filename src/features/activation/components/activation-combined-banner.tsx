"use client";

import { ActivationChecklist } from "@/features/activation/components/activation-checklist";
import { ActivationGuideCard } from "@/features/activation/components/activation-guide-card";
import type { ActivationGuideMode, ActivationStep } from "@/features/activation/lib/activation-types";
import type { WorkspaceIndustry } from "@prisma/client";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface ActivationCombinedBannerProps {
  guideMode: ActivationGuideMode;
  industry: WorkspaceIndustry;
  locale: Locale;
  showChecklist: boolean;
  showFormBadge?: boolean;
  checklistProps?: {
    workspaceSlug: string;
    steps: ActivationStep[];
    isCelebrating: boolean;
    latestEstimateId: string | null;
    onCreateClick: () => void;
    onCopyFormLink: () => void;
    onCelebrationDismissed: () => void;
  };
}

export function ActivationCombinedBanner({
  guideMode,
  industry,
  locale,
  showChecklist,
  showFormBadge = false,
  checklistProps,
}: ActivationCombinedBannerProps) {
  const hasChecklistColumn = showChecklist && checklistProps != null;

  return (
    <div className="surface-card overflow-hidden">
      <div
        className={cn(
          "grid items-stretch",
          hasChecklistColumn
            ? "grid-cols-1 xl:grid-cols-3"
            : "grid-cols-1",
        )}
      >
        <div
          className={cn(
            "min-w-0 p-4 md:p-5",
            hasChecklistColumn && "pb-6 md:pb-5 xl:pb-5",
            hasChecklistColumn && "xl:col-span-2 xl:border-r xl:border-border/50",
          )}
        >
          <ActivationGuideCard
            embedded
            mode={guideMode}
            industry={industry}
            locale={locale}
            showFormBadge={showFormBadge}
          />
        </div>

        {hasChecklistColumn ? (
          <div className="flex min-h-full flex-col border-t border-border/50 px-4 pb-4 pt-8 md:p-5 xl:border-t-0 xl:pt-5">
            <ActivationChecklist embedded {...checklistProps} locale={locale} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ActivationTipsBanner({
  industry,
  locale,
  showFormBadge = false,
}: {
  industry: WorkspaceIndustry;
  locale: Locale;
  showFormBadge?: boolean;
}) {
  return (
    <div className="surface-card p-4 md:p-5">
      <ActivationGuideCard
        embedded
        mode="tips"
        industry={industry}
        locale={locale}
        showFormBadge={showFormBadge}
      />
    </div>
  );
}
