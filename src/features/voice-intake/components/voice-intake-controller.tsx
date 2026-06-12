"use client";



import type { ReactNode } from "react";



import { VoiceExperiencePortal } from "@/features/voice-intake/components/voice-experience-portal";

import { VoiceIntakeTrigger } from "@/features/voice-intake/components/voice-intake-trigger";

import { useVoiceFormApply } from "@/features/voice-intake/hooks/use-voice-form-apply";

import { useVoiceIntake } from "@/features/voice-intake/hooks/use-voice-intake";

import { buildFieldDefinitionsForVoice } from "@/features/voice-intake/lib/build-field-definitions";

import {

  buildRecognizedElements,

  capRecognizedElements,

} from "@/features/voice-intake/lib/build-recognized-elements";

import {

  buildVoiceIntakeMetadata,

  mapExtractionToForm,

} from "@/features/voice-intake/lib/map-extraction-to-form";

import type { VoiceAppliedValues } from "@/features/voice-intake/lib/map-extraction-to-form";

import { trackVoiceEvent } from "@/features/voice-intake/lib/voice-analytics";

import type { VoiceIntakeMetadata } from "@/features/voice-intake/types";

import type {

  EstimateRequestAddressForm,

  EstimateRequestCustomerForm,

  EstimateRequestProjectForm,

  IndustryFieldValue,

} from "@/features/estimate-requests/components/estimate-request-form-fields";

import type { IndustryFieldForDocument } from "@/features/industry-fields/server/get-fields-for-workspace";

import type { Locale } from "@/lib/locale";



export type VoiceFormSetters = {

  setTitle?: (value: string) => void;

  getTitle?: () => string;

  setCustomer: (value: EstimateRequestCustomerForm) => void;

  setAddress: (value: EstimateRequestAddressForm) => void;

  setProject: (value: EstimateRequestProjectForm) => void;

  setIndustryFields: (

    value:

      | Record<string, IndustryFieldValue>

      | ((prev: Record<string, IndustryFieldValue>) => Record<string, IndustryFieldValue>),

  ) => void;

  getIndustryFields: () => Record<string, IndustryFieldValue>;

};



export function VoiceIntakeController({

  locale,

  fields,

  endpoint,

  workspaceSlug,

  workspaceId,

  disabled,

  setters,

  onMetadataReady,

  onAppliedValuesReady,

  renderTrigger,

  children,

}: {

  locale: Locale;

  fields: IndustryFieldForDocument[];

  endpoint: string;

  workspaceSlug?: string;

  workspaceId?: string;

  disabled?: boolean;

  setters: VoiceFormSetters;

  onMetadataReady: (metadata: VoiceIntakeMetadata | null) => void;

  onAppliedValuesReady?: (values: VoiceAppliedValues | null) => void;

  renderTrigger?: (props: { onClick: () => void; disabled?: boolean }) => ReactNode;

  children?: ReactNode;

}) {

  const fieldDefinitions = buildFieldDefinitionsForVoice(fields);

  const voice = useVoiceIntake({

    locale,

    endpoint,

    fieldDefinitions,

    workspaceSlug,

    workspaceId,

  });

  const { applyMappedState } = useVoiceFormApply();



  async function handleApply() {

    if (!voice.extraction || !voice.cleanedTranscript) return;



    const recognizedElements = capRecognizedElements(

      buildRecognizedElements(voice.extraction, voice.cleanedTranscript, locale),

    ).visible;



    voice.setApplyPhase("checklist_reveal");

    trackVoiceEvent("voice_apply_checklist_reveal", {
      recognizedCount: recognizedElements.length,
    });



    const mapped = mapExtractionToForm({

      extraction: voice.extraction,

      descriptionText: voice.displayDescription,

      combinedTranscript: voice.combinedTranscript ?? undefined,

      displayTitle: voice.displayTitle,

      locale,

      currentTitle: setters.getTitle?.() ?? "",

      existingIndustryFields: setters.getIndustryFields(),

    });



    voice.setApplyPhase("filling");



    await applyMappedState(mapped, {

      setTitle: setters.setTitle,

      setCustomer: setters.setCustomer,

      setAddress: setters.setAddress,

      setProject: setters.setProject,

      setIndustryFields: setters.setIndustryFields,

      getIndustryFields: setters.getIndustryFields,

    });



    voice.setApplyPhase("done");



    onAppliedValuesReady?.(mapped.voiceAppliedValues);



    onMetadataReady(

      buildVoiceIntakeMetadata({

        transcript: voice.transcript ?? "",

        followUpTranscript: voice.followUpTranscript ?? undefined,

        combinedTranscript: voice.combinedTranscript ?? voice.transcript ?? "",

        cleanedTranscript: voice.cleanedTranscript,

        displayTitle: voice.displayTitle,

        extraction: voice.extraction,

        overallConfidence: voice.overallConfidence,

        audioDurationMs: voice.lastRecordingDurationMs,

        usedFollowUp: voice.followUpCount > 0,

      }),

    );

  }



  const triggerProps = { onClick: voice.openPortal, disabled };

  return (

    <>

      {renderTrigger ? (
        renderTrigger(triggerProps)
      ) : (
        <VoiceIntakeTrigger onClick={triggerProps.onClick} disabled={triggerProps.disabled} />
      )}

      {children}

      <VoiceExperiencePortal voice={voice} locale={locale} onApply={() => void handleApply()} />

    </>

  );

}


