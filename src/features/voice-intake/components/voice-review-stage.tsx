"use client";

import { useTranslations } from "next-intl";

import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";
import { VoiceAdvancedDetails } from "@/features/voice-intake/components/voice-advanced-details";
import { VoiceInvestmentDescription } from "@/features/voice-intake/components/voice-investment-description";
import { VoiceRecognizedSection } from "@/features/voice-intake/components/voice-recognized-section";
import { VoiceReviewMissingSection } from "@/features/voice-intake/components/voice-review-missing-section";
import type { ConfidenceSummary } from "@/features/voice-intake/lib/build-confidence-summary";
import { WorkspaceIndustry } from "@prisma/client";
import type { MissingFieldInfo } from "@/features/voice-intake/types";
import type { Locale } from "@/lib/locale";
import { Button } from "@/components/ui/button";

export function VoiceReviewStage({
  extraction,
  missingFields,
  confidenceSummary,
  transcript,
  followUpTranscript,
  cleanedTranscript,
  displayDescription,
  descriptionContentKey,
  locale,
  onSaveDescription,
  onApply,
  onFollowUp,
  onReRecord,
  industry = WorkspaceIndustry.CONSTRUCTION,
}: {
  extraction: VoiceIntakeExtraction;
  missingFields: MissingFieldInfo[];
  confidenceSummary: ConfidenceSummary;
  transcript: string;
  followUpTranscript?: string | null;
  cleanedTranscript: string;
  displayDescription: string;
  descriptionContentKey: string;
  locale: Locale;
  industry?: WorkspaceIndustry;
  onSaveDescription: (value: string) => void;
  onApply: () => void;
  onFollowUp: () => void;
  onReRecord: () => void;
}) {
  const t = useTranslations("voiceIntake.review");

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:py-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="space-y-6">
            <VoiceRecognizedSection
              extraction={extraction}
              cleanedTranscript={cleanedTranscript}
              locale={locale}
            />
            <VoiceReviewMissingSection items={missingFields} industry={industry} />
          </div>

          <VoiceInvestmentDescription
            displayDescription={displayDescription}
            contentKey={descriptionContentKey}
            onSaveEdit={onSaveDescription}
          />
        </div>

        <div className="mt-6">
          <VoiceAdvancedDetails
            extraction={extraction}
            confidenceSummary={confidenceSummary}
            initialTranscript={transcript}
            followUpTranscript={followUpTranscript}
          />
        </div>
      </div>

      <div className="shrink-0 space-y-2.5 border-t border-border/60 bg-background/90 px-6 py-5 backdrop-blur-sm">
        <Button type="button" className="h-12 w-full rounded-xl text-base" onClick={onApply}>
          {t("apply")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-xl"
          onClick={onFollowUp}
        >
          {t("followUp")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-10 w-full rounded-xl text-muted-foreground"
          onClick={onReRecord}
        >
          {t("reRecord")}
        </Button>
        <p className="pt-1 text-center text-[10px] leading-4 text-muted-foreground">{t("privacy")}</p>
      </div>
    </div>
  );
}
