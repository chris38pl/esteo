"use client";

import { ClipboardList } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EstimateRequestFormFields,
  createEmptyIndustryFieldValues,
  type EstimateRequestAddressForm,
  type EstimateRequestCustomerForm,
  type EstimateRequestProjectForm,
} from "@/features/estimate-requests/components/estimate-request-form-fields";
import {
  useEstimateRequestSubmit,
  type EstimateRequestSubmitErrorCode,
} from "@/features/estimate-requests/hooks/use-estimate-request-submit";
import { internalEstimateCreateSchema } from "@/features/estimate-requests/schemas/request";
import type { PublicEstimateRequestPageData } from "@/features/estimate-requests/server/public-service";
import { VoiceIntakeController } from "@/features/voice-intake/components/voice-intake-controller";
import { VoiceIntakeFooterBar } from "@/features/voice-intake/components/voice-intake-footer-bar";
import type { VoiceAppliedValues } from "@/features/voice-intake/lib/map-extraction-to-form";
import { trackVoiceCorrectionsOnSubmit } from "@/features/voice-intake/lib/track-voice-corrections";
import type { VoiceIntakeMetadata } from "@/features/voice-intake/types";
import type { Locale } from "@/lib/locale";

interface CreateEstimateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: PublicEstimateRequestPageData;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
}

const FORM_ERROR_MESSAGES = {
  invalid: "form.errors.invalid",
  rate_limited: "form.errors.rate_limited",
  captcha_failed: "form.errors.captcha_failed",
  storage_full: "form.errors.storage_full",
  all_attachments_failed: "form.errors.all_attachments_failed",
  unavailable: "form.errors.unavailable",
} as const satisfies Record<EstimateRequestSubmitErrorCode, string>;

function createInitialFormState(fields: PublicEstimateRequestPageData["fields"]) {
  return {
    title: "",
    customer: {
      fullName: "",
      email: "",
      phone: "",
    } satisfies EstimateRequestCustomerForm,
    address: {
      streetAddress: "",
      city: "",
      postalCode: "",
      voivodeship: "",
    } satisfies EstimateRequestAddressForm,
    project: {
      preferredStartDate: "asap",
      description: "",
    } satisfies EstimateRequestProjectForm,
    industryFields: createEmptyIndustryFieldValues(fields),
  };
}

export function CreateEstimateModal({
  open,
  onOpenChange,
  formData,
  workspaceId,
  workspaceSlug,
  locale,
}: CreateEstimateModalProps) {
  const router = useRouter();
  const t = useTranslations("estimates.create");
  const tForm = useTranslations("estimateRequests");

  const [title, setTitle] = useState("");
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
    createEmptyIndustryFieldValues(formData.fields),
  );
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const voiceIntakeMetadataRef = useRef<VoiceIntakeMetadata | null>(null);
  const voiceAppliedValuesRef = useRef<VoiceAppliedValues | null>(null);

  const { submit, isSubmitting, uploadProgress, errorCode } = useEstimateRequestSubmit({
    endpoint: `/api/estimate-requests/internal?locale=${locale}`,
    onSuccess: (result) => {
      onOpenChange(false);
      router.push(`/${locale}/dashboard/${workspaceSlug}/estimates/${result.estimateId}`);
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const initial = createInitialFormState(formData.fields);
    setTitle(initial.title);
    setCustomer(initial.customer);
    setAddress(initial.address);
    setProject(initial.project);
    setIndustryFields(initial.industryFields);
    setAttachmentFiles([]);
    setValidationError(null);
    voiceIntakeMetadataRef.current = null;
    voiceAppliedValuesRef.current = null;
  }, [open, formData.fields]);

  const canSubmit = project.description.trim().length >= 20;
  const error =
    validationError ??
    (errorCode ? tForm(FORM_ERROR_MESSAGES[errorCode] as "form.errors.invalid") : null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setValidationError(null);

    const payload = {
      title: title.trim() || undefined,
      customer,
      address,
      project: {
        preferredStartDate: project.preferredStartDate,
        description: project.description.trim(),
      },
      industryFields,
      voiceIntake: voiceIntakeMetadataRef.current ?? undefined,
    };

    const parsed = internalEstimateCreateSchema.safeParse(payload);

    if (!parsed.success) {
      setValidationError(tForm("form.errors.invalid"));
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

    void submit(parsed.data, attachmentFiles, { workspaceId });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,880px)] w-[calc(100%-2rem)] max-w-[min(92vw,56rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(92vw,56rem)]">
        <DialogHeader className="shrink-0 border-b px-6 py-5 text-left">
          <div className="flex items-start gap-3 pr-8">
            <div
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
              aria-hidden
            >
              <ClipboardList className="size-5" strokeWidth={2} />
            </div>
            <div className="min-w-0 space-y-2">
              <DialogTitle className="text-xl font-bold tracking-normal text-foreground">
                {tForm("form.title")}
              </DialogTitle>
              <DialogDescription className="text-xs leading-5 text-muted-foreground">
                {tForm("form.description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <EstimateRequestFormFields
              locale={locale}
              fields={formData.fields}
              showTitle
              title={title}
              onTitleChange={setTitle}
              customer={customer}
              onCustomerChange={setCustomer}
              address={address}
              onAddressChange={setAddress}
              project={project}
              onProjectChange={setProject}
              industryFields={industryFields}
              onIndustryFieldChange={(key, value) =>
                setIndustryFields((current) => ({ ...current, [key]: value }))
              }
              attachmentAvailability={formData.attachmentAvailability}
              attachmentFiles={attachmentFiles}
              onAttachmentFilesChange={setAttachmentFiles}
              disabled={isSubmitting}
            />
          </div>

          {error ? (
            <p className="shrink-0 px-6 pb-2 text-sm text-destructive">{error}</p>
          ) : null}
          {uploadProgress !== null ? (
            <p className="shrink-0 px-6 pb-2 text-sm text-muted-foreground">
              {tForm("form.uploading", { percent: uploadProgress })}
            </p>
          ) : null}

          <DialogFooter className="shrink-0 flex-col gap-3 border-t bg-muted/20 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <VoiceIntakeController
              locale={locale}
              fields={formData.fields}
              endpoint={`/api/estimate-requests/voice-intake?locale=${locale}`}
              workspaceId={workspaceId}
              disabled={isSubmitting}
              setters={{
                setTitle,
                getTitle: () => title,
                setCustomer,
                setAddress,
                setProject,
                setIndustryFields,
                getIndustryFields: () => industryFields,
              }}
              onMetadataReady={(metadata) => {
                voiceIntakeMetadataRef.current = metadata;
              }}
              onAppliedValuesReady={(values) => {
                voiceAppliedValuesRef.current = values;
              }}
              renderTrigger={({ onClick, disabled }) => (
                <VoiceIntakeFooterBar onClick={onClick} disabled={disabled} className="w-full" />
              )}
            />
            <Button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="h-12 shrink-0 rounded-xl px-8 py-3 sm:ml-auto"
            >
              {isSubmitting ? t("submitting") : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
