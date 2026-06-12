"use client";



import { useCallback, useEffect, useMemo, useRef, useState } from "react";



import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";

import { buildConfidenceSummary } from "@/features/voice-intake/lib/build-confidence-summary";

import {
  diffMissingFields,
  type ResolvedFieldItem,
} from "@/features/voice-intake/lib/diff-missing-fields";

import {

  detectMissingFields,

} from "@/features/voice-intake/lib/detect-missing-fields";

import type { VoiceIntakeFieldDefinitionSummary } from "@/ai/prompts/voice-intake-extraction";

import {

  VoiceAnalyticsEvents,

  trackVoiceEvent,

} from "@/features/voice-intake/lib/voice-analytics";

import type {
  VoiceIntakeApiResponse,
  VoiceIntakeErrorCode,
  VoiceApplyPhase,
  VoiceIntakePhase,
  MissingFieldInfo,
} from "@/features/voice-intake/types";

import type { Locale } from "@/lib/locale";



export function useVoiceIntake(input: {

  locale: Locale;

  endpoint: string;

  fieldDefinitions: VoiceIntakeFieldDefinitionSummary[];

  captchaToken?: string;

  workspaceSlug?: string;

  workspaceId?: string;

}) {

  const [open, setOpen] = useState(false);

  const [phase, setPhase] = useState<VoiceIntakePhase>("idle");

  const [applyPhase, setApplyPhase] = useState<VoiceApplyPhase>("idle");

  const [extraction, setExtraction] = useState<VoiceIntakeExtraction | null>(null);

  const [transcript, setTranscript] = useState<string | null>(null);

  const [followUpTranscript, setFollowUpTranscript] = useState<string | null>(null);

  const [combinedTranscript, setCombinedTranscript] = useState<string | null>(null);

  const [cleanedTranscript, setCleanedTranscript] = useState<string | null>(null);

  const [displayTitle, setDisplayTitle] = useState<string | null>(null);

  const [editedDescription, setEditedDescription] = useState<string | null>(null);

  const [followUpCount, setFollowUpCount] = useState(0);

  const [hadFollowUpBeforeApply, setHadFollowUpBeforeApply] = useState(false);

  const [error, setError] = useState<VoiceIntakeErrorCode | null>(null);

  const [overallConfidence, setOverallConfidence] = useState(0);

  const [lastRecordingDurationMs, setLastRecordingDurationMs] = useState(0);

  const [followUpResolvedItems, setFollowUpResolvedItems] = useState<ResolvedFieldItem[]>([]);

  const [followUpStillMissing, setFollowUpStillMissing] = useState<MissingFieldInfo[]>([]);

  const [followUpNoNewInfo, setFollowUpNoNewInfo] = useState(false);

  const [summaryRecordingActive, setSummaryRecordingActive] = useState(false);

  const missingBeforeFollowUpRef = useRef<MissingFieldInfo[]>([]);

  const lastNonErrorPhaseRef = useRef<VoiceIntakePhase>("recording_initial");

  useEffect(() => {
    if (phase !== "error" && phase !== "idle" && phase !== "applying") {
      lastNonErrorPhaseRef.current = phase;
    }
  }, [phase]);

  const missingFields = useMemo(

    () => (extraction ? detectMissingFields(extraction, input.locale) : []),

    [extraction, input.locale],

  );



  const displayDescription = editedDescription ?? cleanedTranscript ?? "";



  const resetSession = useCallback(() => {

    setExtraction(null);

    setTranscript(null);

    setFollowUpTranscript(null);

    setCombinedTranscript(null);

    setCleanedTranscript(null);

    setDisplayTitle(null);

    setEditedDescription(null);

    setFollowUpCount(0);

    setHadFollowUpBeforeApply(false);

    setError(null);

    setOverallConfidence(0);

    setLastRecordingDurationMs(0);

    setFollowUpResolvedItems([]);

    setFollowUpStillMissing([]);

    setFollowUpNoNewInfo(false);

    setSummaryRecordingActive(false);

    setApplyPhase("idle");

    missingBeforeFollowUpRef.current = [];

  }, []);



  const openPortal = useCallback(() => {

    resetSession();

    setOpen(true);

    setPhase("recording_initial");

    trackVoiceEvent(VoiceAnalyticsEvents.started);

  }, [resetSession]);



  const closePortal = useCallback(() => {

    setOpen(false);

    setPhase("idle");

    trackVoiceEvent(VoiceAnalyticsEvents.abandoned, { phase });

  }, [phase]);



  const applyApiResponse = useCallback(

    (body: VoiceIntakeApiResponse, isFollowUp: boolean) => {

      setExtraction(body.extraction);

      setCombinedTranscript(body.combinedTranscript);

      setCleanedTranscript(body.cleanedTranscript);

      setDisplayTitle(body.displayTitle);

      setEditedDescription(null);

      setOverallConfidence(body.overallConfidence);



      if (!isFollowUp) {

        setTranscript(body.transcript);

        setFollowUpTranscript(null);

      } else {

        setFollowUpTranscript(body.followUpTranscript ?? null);

      }

    },

    [],

  );



  const submitAudio = useCallback(

    async (blob: Blob, durationMs: number, isFollowUp: boolean) => {

      setLastRecordingDurationMs(durationMs);

      setPhase(isFollowUp ? "analyzing_follow_up" : "analyzing");

      setError(null);



      const formData = new FormData();

      formData.append("audio", blob, "recording.webm");

      formData.append("durationMs", String(durationMs));

      formData.append("fieldDefinitions", JSON.stringify(input.fieldDefinitions));



      if (input.workspaceSlug) {

        formData.append("workspaceSlug", input.workspaceSlug);

      }



      if (input.workspaceId) {

        formData.append("workspaceId", input.workspaceId);

      }



      if (input.captchaToken) {

        formData.append("captchaToken", input.captchaToken);

      }



      if (isFollowUp && extraction && transcript && combinedTranscript) {

        formData.append(

          "followUpContext",

          JSON.stringify({

            previousTranscript: combinedTranscript,

            initialTranscript: transcript,

            previousExtraction: extraction,

            missingFieldLabels: missingFields.map((m) => m.label),

            missingFieldKeys: missingFields.map((m) => m.fieldKey),

          }),

        );

      }



      try {

        const response = await fetch(input.endpoint, {

          method: "POST",

          body: formData,

        });



        const body = (await response.json()) as VoiceIntakeApiResponse & { error?: string };



        if (!response.ok) {

          setError((body.error as VoiceIntakeErrorCode) ?? "unavailable");

          setPhase("error");

          return;

        }



        applyApiResponse(body, isFollowUp);



        if (isFollowUp) {

          const currentMissing = detectMissingFields(body.extraction, input.locale);

          const diff = diffMissingFields({

            previousMissing: missingBeforeFollowUpRef.current,

            currentMissing,

            extraction: body.extraction,

            locale: input.locale,

          });



          setFollowUpResolvedItems(diff.resolvedItems);

          setFollowUpStillMissing(diff.stillMissing);

          setFollowUpNoNewInfo(diff.noNewInfo);

          setFollowUpCount((c) => c + 1);

          setPhase("review");

          trackVoiceEvent(VoiceAnalyticsEvents.followUpCompleted, {

            stillMissingKeys: diff.stillMissing.map((m) => m.fieldKey),

            resolvedCount: diff.resolvedItems.length,

          });

        } else {

          setPhase("review");

          trackVoiceEvent(VoiceAnalyticsEvents.completed, {

            overallConfidence: body.overallConfidence,

          });

        }

      } catch {

        setError("unavailable");

        setPhase("error");

      }

    },

    [

      applyApiResponse,

      combinedTranscript,

      extraction,

      input.captchaToken,

      input.endpoint,

      input.fieldDefinitions,

      input.locale,

      input.workspaceId,

      input.workspaceSlug,

      missingFields,

      transcript,

    ],

  );



  const snapshotMissingBeforeFollowUp = useCallback(() => {

    missingBeforeFollowUpRef.current = missingFields;

    trackVoiceEvent(VoiceAnalyticsEvents.followUpStarted, {

      missingFieldKeys: missingFields.map((m) => m.fieldKey),

    });

    setError(null);

  }, [missingFields]);

  const clearFollowUpFeedback = useCallback(() => {

    setFollowUpResolvedItems([]);

    setFollowUpNoNewInfo(false);

  }, []);

  const startFollowUpRecording = useCallback(() => {

    clearFollowUpFeedback();

    snapshotMissingBeforeFollowUp();

    setPhase("recording_follow_up");

  }, [clearFollowUpFeedback, snapshotMissingBeforeFollowUp]);

  const reRecordFromScratch = useCallback(() => {

    trackVoiceEvent(VoiceAnalyticsEvents.reRecorded, {

      hadPartialExtraction: extraction !== null,

    });

    resetSession();

    setPhase("recording_initial");

  }, [extraction, resetSession]);

  const retryFromError = useCallback(() => {
    setError(null);
    const last = lastNonErrorPhaseRef.current;

    if (last === "recording_follow_up") {
      setPhase("recording_follow_up");
      return;
    }

    if (last === "recording_initial") {
      setPhase("recording_initial");
      return;
    }

    if (extraction && cleanedTranscript) {
      setPhase("review");
      return;
    }

    setPhase("recording_initial");
  }, [extraction, cleanedTranscript]);

  const markApplying = useCallback(() => {

    if (followUpCount > 0) {

      setHadFollowUpBeforeApply(true);

      trackVoiceEvent(VoiceAnalyticsEvents.followUpApplied);

    }



    trackVoiceEvent(VoiceAnalyticsEvents.apply, {

      usedFollowUp: followUpCount > 0,

    });



    setApplyPhase("filling");

    setPhase("applying");

    setOpen(false);

  }, [followUpCount]);



  const confidenceSummary = extraction ? buildConfidenceSummary(extraction) : null;



  return {

    open,

    phase,

    setPhase,

    applyPhase,

    setApplyPhase,

    extraction,

    transcript,

    followUpTranscript,

    combinedTranscript,

    cleanedTranscript,

    displayTitle,

    editedDescription,

    setEditedDescription,

    displayDescription,

    missingFields,

    summaryRecordingActive,

    followUpCount,

    hadFollowUpBeforeApply,

    followUpResolvedItems,

    followUpStillMissing,

    followUpNoNewInfo,

    error,

    overallConfidence,

    confidenceSummary,

    lastRecordingDurationMs,

    openPortal,

    closePortal,

    submitAudio,

    snapshotMissingBeforeFollowUp,

    clearFollowUpFeedback,

    startFollowUpRecording,

    setSummaryRecordingActive,

    reRecordFromScratch,

    retryFromError,

    markApplying,

    resetSession,

    setError,

  };

}


