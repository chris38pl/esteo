"use client";



import { useMemo } from "react";

import { useTranslations } from "next-intl";



import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";

import { VoiceFollowUpMissingList } from "@/features/voice-intake/components/voice-follow-up-missing-list";

import { VoiceFollowUpScopeBadges } from "@/features/voice-intake/components/voice-follow-up-scope-badges";

import { VoiceSummaryActions } from "@/features/voice-intake/components/voice-summary-actions";

import { VoiceSummaryHeroIcon } from "@/features/voice-intake/components/voice-summary-hero-icon";
import { VoiceSummaryResolvedItems } from "@/features/voice-intake/components/voice-summary-resolved-items";

import { buildFollowUpScopeBadges } from "@/features/voice-intake/lib/build-follow-up-scope-badges";

import type { ResolvedFieldItem } from "@/features/voice-intake/lib/diff-missing-fields";
import type { VoiceRecordingPreviewState } from "@/features/voice-intake/lib/voice-recording-preview";
import type { MissingFieldInfo } from "@/features/voice-intake/types";

import type { Locale } from "@/lib/locale";

export function VoiceSummaryStage({

  extraction,

  cleanedTranscript,

  missingFields,

  followUpResolvedItems,

  followUpNoNewInfo,

  onStartFollowUp,

  onApply,

  onReRecord,

  preview,

}: {

  extraction: VoiceIntakeExtraction;

  cleanedTranscript: string;

  locale: Locale;

  missingFields: MissingFieldInfo[];

  followUpResolvedItems: ResolvedFieldItem[];

  followUpNoNewInfo: boolean;

  onStartFollowUp: () => void;

  onApply: () => void;

  onReRecord: () => void;

  preview?: VoiceRecordingPreviewState;

}) {

  const tReview = useTranslations("voiceIntake.review");

  const tSuccess = useTranslations("voiceIntake.followUpSuccess");

  const isPreview = preview !== undefined;



  const scopeBadges = useMemo(

    () => buildFollowUpScopeBadges(extraction, cleanedTranscript),

    [extraction, cleanedTranscript],

  );



  const hasMissingFields = missingFields.some(

    (item) => item.priority === "key" || item.priority === "contact",

  );



  return (

    <div className="flex w-full flex-col">

      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 pb-10 sm:gap-3.5 sm:px-6 sm:pt-4">

        <VoiceSummaryHeroIcon />

        <div className="mb-1 w-full space-y-4 text-center sm:mb-2 sm:space-y-6">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {tReview("understoodHeading")}
          </h2>

          <VoiceFollowUpScopeBadges labels={scopeBadges} />
        </div>

        {followUpResolvedItems.length > 0 ? (
          <div className="mt-1 w-full">
            <VoiceSummaryResolvedItems items={followUpResolvedItems} />
          </div>
        ) : null}



        {followUpNoNewInfo ? (

          <p className="w-full text-center text-sm text-muted-foreground">{tSuccess("noNewInfo")}</p>

        ) : null}



        {hasMissingFields ? (
          <div className="mt-1 w-full">
            <VoiceFollowUpMissingList items={missingFields} />
          </div>
        ) : (
          <div className="mt-1 w-full space-y-2.5 pt-2 text-center">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              {tReview("completeHeading")}
            </h3>
            <p className="text-sm text-muted-foreground">{tReview("completeSubtitle")}</p>
          </div>
        )}



        <div className="mt-8 w-full">

          <VoiceSummaryActions
            onApply={onApply}
            onFollowUpPress={onStartFollowUp}
            onReRecord={onReRecord}
          />

        </div>

      </div>

    </div>

  );

}

