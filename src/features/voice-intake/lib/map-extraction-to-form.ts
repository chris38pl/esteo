import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";



import type {

  EstimateRequestAddressForm,

  EstimateRequestCustomerForm,

  EstimateRequestProjectForm,

} from "@/features/estimate-requests/components/estimate-request-form-fields";

import { resolveGeneratedTitle } from "@/features/voice-intake/lib/resolve-generated-title";

import type { IndustryFieldValue } from "@/features/estimate-requests/components/estimate-request-form-fields";

import type { Locale } from "@/lib/locale";



export type VoiceTrackableField = "city" | "area" | "preferredStartDate" | "propertyType";



export type VoiceAppliedValues = Partial<Record<VoiceTrackableField, string | number | null>>;



export type MappedVoiceFormState = {

  title?: string;

  customer: EstimateRequestCustomerForm;

  address: EstimateRequestAddressForm;

  project: EstimateRequestProjectForm;

  industryFields: Record<string, IndustryFieldValue>;

  voiceAppliedValues: VoiceAppliedValues;

};



export const ANIMATED_FIELD_KEYS = [

  "industryFields.property_type",

  "address.city",

  "industryFields.area_size",

  "project.preferredStartDate",

  "project.description",

] as const;



export const INSTANT_FIELD_KEYS = [

  "address.streetAddress",

  "address.postalCode",

  "address.voivodeship",

  "customer.fullName",

  "customer.email",

  "customer.phone",

  "title",

] as const;



function shouldApplyField(confidence: number, value: unknown): boolean {

  if (value === null || value === "") return false;

  return confidence >= 0.5;

}



function resolveDescription(input: {

  descriptionText: string;

  combinedTranscript?: string;

}): string {

  const fromCleaned = input.descriptionText.trim();

  if (fromCleaned.length >= 20) {

    return fromCleaned;

  }



  const fromCombined = input.combinedTranscript?.trim() ?? "";

  if (fromCombined.length >= 20) {

    return fromCombined;

  }



  return fromCleaned || fromCombined;

}



export function mapExtractionToForm(input: {

  extraction: VoiceIntakeExtraction;

  descriptionText: string;

  combinedTranscript?: string;

  displayTitle?: string | null;

  locale: Locale;

  currentTitle?: string;

  existingIndustryFields: Record<string, IndustryFieldValue>;

}): MappedVoiceFormState {

  const { extraction } = input;



  const customer: EstimateRequestCustomerForm = {

    fullName: "",

    email: "",

    phone: "",

  };



  if (shouldApplyField(extraction.fullName.confidence, extraction.fullName.value)) {

    customer.fullName = extraction.fullName.value!;

  }

  if (shouldApplyField(extraction.email.confidence, extraction.email.value)) {

    customer.email = extraction.email.value!;

  }

  if (shouldApplyField(extraction.phone.confidence, extraction.phone.value)) {

    customer.phone = extraction.phone.value!;

  }



  const address: EstimateRequestAddressForm = {

    streetAddress: "",

    city: "",

    postalCode: "",

    voivodeship: "",

  };



  if (shouldApplyField(extraction.address.confidence, extraction.address.value)) {

    address.streetAddress = extraction.address.value!;

  }

  if (shouldApplyField(extraction.city.confidence, extraction.city.value)) {

    address.city = extraction.city.value!;

  }

  if (shouldApplyField(extraction.postalCode.confidence, extraction.postalCode.value)) {

    address.postalCode = extraction.postalCode.value!;

  }

  if (shouldApplyField(extraction.voivodeship.confidence, extraction.voivodeship.value)) {

    address.voivodeship = extraction.voivodeship.value!;

  }



  const project: EstimateRequestProjectForm = {

    preferredStartDate: "asap",

    description: "",

  };



  if (

    shouldApplyField(extraction.preferredStartDate.confidence, extraction.preferredStartDate.value)

  ) {

    project.preferredStartDate = extraction.preferredStartDate.value!;

  }



  project.description = resolveDescription({

    descriptionText: input.descriptionText,

    combinedTranscript: input.combinedTranscript,

  });



  const industryFields = { ...input.existingIndustryFields };



  if (shouldApplyField(extraction.propertyType.confidence, extraction.propertyType.value)) {

    industryFields.property_type = extraction.propertyType.value!;

  }



  if (shouldApplyField(extraction.area.confidence, extraction.area.value)) {

    industryFields.area_size = extraction.area.value!;

  }



  const title = resolveGeneratedTitle(

    input.currentTitle ?? "",

    extraction,

    input.locale,

    input.displayTitle,

  );



  const voiceAppliedValues: VoiceAppliedValues = {};



  if (shouldApplyField(extraction.city.confidence, extraction.city.value)) {

    voiceAppliedValues.city = extraction.city.value;

  }

  if (shouldApplyField(extraction.area.confidence, extraction.area.value)) {

    voiceAppliedValues.area = extraction.area.value;

  }

  if (

    shouldApplyField(extraction.preferredStartDate.confidence, extraction.preferredStartDate.value)

  ) {

    voiceAppliedValues.preferredStartDate = extraction.preferredStartDate.value;

  }

  if (shouldApplyField(extraction.propertyType.confidence, extraction.propertyType.value)) {

    voiceAppliedValues.propertyType = extraction.propertyType.value;

  }



  return {

    title: title || undefined,

    customer,

    address,

    project,

    industryFields,

    voiceAppliedValues,

  };

}



export function buildVoiceIntakeMetadata(input: {

  transcript: string;

  followUpTranscript?: string;

  combinedTranscript: string;

  cleanedTranscript: string;

  displayTitle?: string | null;

  extraction: VoiceIntakeExtraction;

  overallConfidence: number;

  audioDurationMs?: number;

  followUpDurationMs?: number;

  usedFollowUp: boolean;

}): import("@/features/voice-intake/types").VoiceIntakeMetadata {

  return {

    version: 2,

    transcript: input.transcript,

    followUpTranscript: input.followUpTranscript,

    combinedTranscript: input.combinedTranscript,

    cleanedTranscript: input.cleanedTranscript,

    displayTitle: input.displayTitle ?? null,

    projectSummary: input.extraction.projectSummary.value,

    generatedTitle: input.extraction.generatedTitle.value,

    overallConfidence: input.overallConfidence,

    fieldConfidences: {

      city: input.extraction.city.confidence,

      area: input.extraction.area.confidence,

      propertyType: input.extraction.propertyType.confidence,

      preferredStartDate: input.extraction.preferredStartDate.confidence,

      scopeOfWork: input.extraction.scopeOfWork.confidence,

    },

    audioDurationMs: input.audioDurationMs,

    followUpDurationMs: input.followUpDurationMs,

    usedFollowUp: input.usedFollowUp,

    models: {

      whisper: "gpt-4o-mini-transcribe",

      extraction: "gpt-4o-mini",

    },

  };

}


