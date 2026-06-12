"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import {
  createEmptyIndustryFieldValues,
  type EstimateRequestAddressForm,
  type EstimateRequestCustomerForm,
  type EstimateRequestProjectForm,
} from "@/features/estimate-requests/components/estimate-request-form-fields";
import {
  useEstimateRequestSubmit,
  type EstimateRequestSubmitErrorCode,
} from "@/features/estimate-requests/hooks/use-estimate-request-submit";
import { publicEstimateRequestSchema } from "@/features/estimate-requests/schemas/request";
import type { PublicEstimateRequestPageData } from "@/features/estimate-requests/server/public-service";
import type { VoiceAppliedValues } from "@/features/voice-intake/lib/map-extraction-to-form";
import { trackVoiceCorrectionsOnSubmit } from "@/features/voice-intake/lib/track-voice-corrections";
import type { VoiceIntakeMetadata } from "@/features/voice-intake/types";
import type { Locale } from "@/lib/locale";

const FORM_ERROR_MESSAGES = {
  invalid: "form.errors.invalid",
  rate_limited: "form.errors.rate_limited",
  captcha_failed: "form.errors.captcha_failed",
  storage_full: "form.errors.storage_full",
  all_attachments_failed: "form.errors.all_attachments_failed",
  unavailable: "form.errors.unavailable",
} as const satisfies Record<EstimateRequestSubmitErrorCode, `form.errors.${string}`>;

export function useEstimateRequestFormState({
  locale,
  pageData,
}: {
  locale: Locale;
  pageData: PublicEstimateRequestPageData;
}) {
  const t = useTranslations("estimateRequests");
  const [customer, setCustomer] = useState<EstimateRequestCustomerForm>({
    fullName: "",
    email: "",
    phone: "",
  });
  const [address, setAddress] = useState<EstimateRequestAddressForm>({
    streetAddress: "",
    city: "",
    postalCode: "",
    voivodeship: "",
  });
  const [project, setProject] = useState<EstimateRequestProjectForm>({
    preferredStartDate: "asap",
    description: "",
  });
  const [industryFields, setIndustryFields] = useState(() =>
    createEmptyIndustryFieldValues(pageData.fields),
  );
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [requestNumber, setRequestNumber] = useState<string | null>(null);
  const voiceIntakeMetadataRef = useRef<VoiceIntakeMetadata | null>(null);
  const voiceAppliedValuesRef = useRef<VoiceAppliedValues | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { submit, isSubmitting, uploadProgress, errorCode, attachmentWarnings } =
    useEstimateRequestSubmit({
      endpoint: `/api/public/estimate-requests?locale=${locale}`,
      onSuccess: (result) => {
        setRequestNumber(result.requestNumber);
      },
    });

  const error =
    validationError ?? (errorCode ? t(FORM_ERROR_MESSAGES[errorCode]) : null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    const payload = {
      workspaceSlug: pageData.workspace.slug,
      customer,
      address,
      project,
      industryFields,
      security: {
        companyWebsite,
        captchaToken: "",
      },
      voiceIntake: voiceIntakeMetadataRef.current ?? undefined,
    };

    const parsed = publicEstimateRequestSchema.safeParse(payload);
    if (!parsed.success) {
      setValidationError(t("form.errors.invalid"));
      return;
    }

    trackVoiceCorrectionsOnSubmit(voiceAppliedValuesRef.current, {
      city: address.city,
      area:
        typeof industryFields.area_size === "number"
          ? industryFields.area_size
          : String(industryFields.area_size ?? ""),
      preferredStartDate: project.preferredStartDate,
      propertyType: String(industryFields.property_type ?? ""),
    });

    void submit(parsed.data, attachmentFiles);
  }

  const voiceSetters = {
    setCustomer,
    setAddress,
    setProject,
    setIndustryFields,
    getIndustryFields: () => industryFields,
  };

  const voiceCallbacks = {
    onMetadataReady: (metadata: VoiceIntakeMetadata | null) => {
      voiceIntakeMetadataRef.current = metadata;
    },
    onAppliedValuesReady: (values: VoiceAppliedValues | null) => {
      voiceAppliedValuesRef.current = values;
    },
  };

  return {
    t,
    customer,
    setCustomer,
    address,
    setAddress,
    project,
    setProject,
    industryFields,
    setIndustryFields,
    attachmentFiles,
    setAttachmentFiles,
    companyWebsite,
    setCompanyWebsite,
    requestNumber,
    isSubmitting,
    uploadProgress,
    attachmentWarnings,
    error,
    handleSubmit,
    voiceSetters,
    voiceCallbacks,
  };
}
