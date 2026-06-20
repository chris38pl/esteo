"use client";

import { AlertTriangle, ClipboardList } from "lucide-react";
import Link from "next/link";
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
import type { CreateEstimateGate } from "@/features/estimates/lib/create-estimate-gate";
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
import { useRequestAttachmentUpload } from "@/features/estimate-requests/hooks/use-request-attachment-upload";
import { createInternalEstimateCreateSchema } from "@/features/estimate-requests/schemas/request";
import type { PublicEstimateRequestPageData } from "@/features/estimate-requests/server/public-service";
import { VoiceIntakeController } from "@/features/voice-intake/components/voice-intake-controller";
import { VoiceIntakeFooterBar } from "@/features/voice-intake/components/voice-intake-footer-bar";
import type { VoiceAppliedValues } from "@/features/voice-intake/lib/map-extraction-to-form";
import { trackVoiceCorrectionsOnSubmit } from "@/features/voice-intake/lib/track-voice-corrections";
import type { VoiceIntakeMetadata } from "@/features/voice-intake/types";
import { dashboardBillingHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface CreateEstimateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: PublicEstimateRequestPageData;
  createEstimateGate: CreateEstimateGate;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  onEstimateOpening?: (estimateId: string) => void;
}

const FORM_ERROR_MESSAGES = {
  invalid: "form.errors.invalid",
  rate_limited: "form.errors.rate_limited",
  captcha_failed: "form.errors.captcha_failed",
  storage_full: "form.errors.storage_full",
  all_attachments_failed: "form.errors.all_attachments_failed",
  attachments_not_ready: "form.errors.attachments_not_ready",
  payload_too_large: "form.errors.payload_too_large",
  unauthorized: "form.errors.unauthorized",
  forbidden: "form.errors.forbidden",
  server_error: "form.errors.server_error",
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
  createEstimateGate,
  workspaceId,
  workspaceSlug,
  locale,
  onEstimateOpening,
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
  const stagingUpload = useRequestAttachmentUpload({
    uploadEndpoint: "/api/estimate-requests/attachments/upload",
    deleteEndpointBase: "/api/estimate-requests/attachments",
    workspaceId,
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const voiceIntakeMetadataRef = useRef<VoiceIntakeMetadata | null>(null);
  const voiceAppliedValuesRef = useRef<VoiceAppliedValues | null>(null);

  const { submit, isSubmitting, errorCode } = useEstimateRequestSubmit({
    endpoint: `/api/estimate-requests/internal?locale=${locale}`,
    onSuccess: (result) => {
      if (!result.estimateId) {
        return;
      }

      stagingUpload.reset();
      onEstimateOpening?.(result.estimateId);
      onOpenChange(false);
      router.push(`/${locale}/dashboard/${workspaceSlug}/estimates/${result.estimateId}`);
    },
  });

  const prevOpenRef = useRef(false);

  useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    prevOpenRef.current = open;

    if (!justOpened) {
      return;
    }

    const initial = createInitialFormState(formData.fields);
    setTitle(initial.title);
    setCustomer(initial.customer);
    setAddress(initial.address);
    setProject(initial.project);
    setIndustryFields(initial.industryFields);
    stagingUpload.reset();
    setValidationError(null);
    voiceIntakeMetadataRef.current = null;
    voiceAppliedValuesRef.current = null;
  }, [open]);

  const canSubmit =
    project.description.trim().length >= 20 &&
    stagingUpload.canSubmitAttachments &&
    !stagingUpload.isUploading;
  const canCreateEstimate = createEstimateGate.allowed;
  const isPlanLimitReached = createEstimateGate.reason === "PLAN_LIMIT";
  const billingHref = dashboardBillingHref(locale, workspaceSlug);
  const limitMessage =
    isPlanLimitReached && createEstimateGate.maxEstimatesPerMonth !== null
      ? t("limitReached", {
          used: createEstimateGate.estimatesThisMonth,
          limit: createEstimateGate.maxEstimatesPerMonth,
        })
      : !canCreateEstimate
        ? t("createUnavailable")
        : null;
  const error =
    validationError ??
    (errorCode ? tForm(FORM_ERROR_MESSAGES[errorCode] as "form.errors.invalid") : null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || !canCreateEstimate) {
      return;
    }

    setValidationError(null);

    if (!stagingUpload.canSubmitAttachments) {
      setValidationError(tForm("form.errors.attachments_not_ready"));
      return;
    }

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

    const parsed = createInternalEstimateCreateSchema(formData.workspace.industry).safeParse(payload);

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

    void submit(parsed.data, stagingUpload.attachmentIds, { workspaceId });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,880px)] w-[calc(100%-2rem)] max-w-[min(92vw,56rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(92vw,56rem)] max-sm:fixed max-sm:inset-0 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0">
        <DialogHeader className="shrink-0 border-b px-4 py-4 text-left sm:px-6 sm:py-5">
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
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-5 [-webkit-overflow-scrolling:touch] sm:px-6">
            <EstimateRequestFormFields
              locale={locale}
              industry={formData.workspace.industry}
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
              stagingAttachments={stagingUpload.items}
              onStagingAddFiles={stagingUpload.addFiles}
              onStagingRemove={(clientId) => {
                void stagingUpload.remove(clientId);
              }}
              onStagingRetry={stagingUpload.retry}
              stagingLocalError={stagingUpload.localError}
              disabled={isSubmitting || stagingUpload.isUploading}
            />

            <div className="mt-8">
              <VoiceIntakeController
                locale={locale}
                industry={formData.workspace.industry}
                industryOtherText={formData.workspace.industryOtherText}
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
            </div>

            {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
          </div>

          <DialogFooter className="shrink-0 flex-col gap-3 border-t bg-muted/20 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
            {limitMessage ? (
              <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center sm:gap-3">
                <p className="flex min-w-0 items-start gap-2 text-xs leading-5 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{limitMessage}</span>
                </p>
                {isPlanLimitReached ? (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-9 shrink-0 rounded-lg border-amber-500/30 bg-amber-500/10 px-3 text-xs font-medium",
                      "text-amber-800 hover:bg-amber-500/15 hover:text-amber-900",
                      "dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200 dark:hover:bg-amber-400/15 dark:hover:text-amber-100",
                    )}
                  >
                    <Link href={billingHref}>{t("upgradeCta")}</Link>
                  </Button>
                ) : null}
              </div>
            ) : (
              <span className="hidden sm:block sm:flex-1" aria-hidden />
            )}
            <Button
              type="submit"
              disabled={isSubmitting || !canSubmit || !canCreateEstimate}
              className="h-12 w-full rounded-xl px-8 py-3 sm:w-auto sm:shrink-0"
            >
              {isSubmitting ? t("submitting") : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
