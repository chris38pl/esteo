"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";

import type { EstimateAttachmentClient } from "@/features/attachments/lib/serialize-attachments";
import type { EstimateEditorTabId } from "@/features/estimates/components/estimate-editor-tabs";
import {
  getSummaryRecommendationDefinition,
  resolveSummaryRecommendations,
  SUMMARY_RECOMMENDATION_IDS,
  type SummaryRecommendationId,
} from "@/features/estimates/lib/estimate-summary-recommendations-config";
import type { PaymentInstallmentClient } from "@/features/estimates/lib/serialize-payment-installments";
import { cn } from "@/lib/utils";

import { EstimateSummaryCardShell } from "./estimate-summary-card-shell";
import { EstimateSummarySectionHeader } from "./estimate-summary-section-header";

interface EstimateSummaryRecommendationsCardProps {
  installments: PaymentInstallmentClient[];
  attachments: EstimateAttachmentClient[];
  onOpenTab?: (tab: EstimateEditorTabId) => void;
  onExportPdf?: () => void;
  /** Wider card layout — split recommendation items into two columns */
  wide?: boolean;
}

function RecommendationRow({
  id,
  onSelect,
}: {
  id: SummaryRecommendationId;
  onSelect?: () => void;
}) {
  const t = useTranslations("estimates");
  const definition = getSummaryRecommendationDefinition(id);

  if (!definition) {
    return null;
  }

  const Icon = definition.icon;
  const interactive = Boolean(onSelect);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!interactive}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border border-border/60 bg-muted/10 px-4 py-3 text-left transition-colors",
        interactive && "hover:border-primary/30 hover:bg-primary/5",
        !interactive && "cursor-default",
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">
          {t(`editor.summary.recommendations.items.${id}.title`)}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
          {t(`editor.summary.recommendations.items.${id}.description`)}
        </span>
      </span>
    </button>
  );
}

export function EstimateSummaryRecommendationsCard({
  installments,
  attachments,
  onOpenTab,
  onExportPdf,
  wide = false,
}: EstimateSummaryRecommendationsCardProps) {
  const t = useTranslations("estimates");

  const imageAttachmentCount = useMemo(
    () => attachments.filter((attachment) => attachment.attachmentType === "IMAGE").length,
    [attachments],
  );

  const recommendationIds = useMemo(
    () =>
      resolveSummaryRecommendations({
        installmentCount: installments.length,
        attachmentCount: attachments.length,
        imageAttachmentCount,
      }),
    [attachments.length, imageAttachmentCount, installments.length],
  );

  if (recommendationIds.length === 0) {
    return null;
  }

  return (
    <EstimateSummaryCardShell>
      <EstimateSummarySectionHeader
        icon={Sparkles}
        title={t("editor.summary.recommendations.title")}
      />

      <div
        className={cn(
          "border-t border-border/60 px-5 py-4",
          wide ? "grid grid-cols-1 gap-2 lg:grid-cols-2" : "space-y-2",
        )}
      >
        {recommendationIds.map((id) => {
          const definition = getSummaryRecommendationDefinition(id);
          const handleSelect =
            id === SUMMARY_RECOMMENDATION_IDS.generate_pdf && onExportPdf
              ? onExportPdf
              : definition?.targetTab && onOpenTab
                ? () => onOpenTab(definition.targetTab!)
                : undefined;

          return <RecommendationRow key={id} id={id} onSelect={handleSelect} />;
        })}
      </div>
    </EstimateSummaryCardShell>
  );
}
