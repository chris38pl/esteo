"use client";

import { ArrowRight, Bot, CheckCircle2, Loader2 } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";

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
import { publicEstimateRequestSchema } from "@/features/estimate-requests/schemas/request";
import { checkEstimateRequestWithAiAction } from "@/features/estimate-requests/server/public-actions";
import type { PublicEstimateRequestPageData } from "@/features/estimate-requests/server/public-service";
import type { Locale } from "@/lib/locale";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const FORM_ERROR_MESSAGES = {
  invalid: "form.errors.invalid",
  rate_limited: "form.errors.rate_limited",
  captcha_failed: "form.errors.captcha_failed",
  storage_full: "form.errors.storage_full",
  all_attachments_failed: "form.errors.all_attachments_failed",
  unavailable: "form.errors.unavailable",
} as const satisfies Record<EstimateRequestSubmitErrorCode, `form.errors.${string}`>;

export function EstimateRequestForm({
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
  const [aiMessage, setAiMessage] = useState<string | null>(null);

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
    setAiMessage(null);
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
    };

    const parsed = publicEstimateRequestSchema.safeParse(payload);
    if (!parsed.success) {
      setValidationError(t("form.errors.invalid"));
      return;
    }

    void submit(parsed.data, attachmentFiles);
  }

  async function handleAiCheck() {
    setAiMessage(null);
    const result = await checkEstimateRequestWithAiAction();
    setAiMessage(result.success ? result.data.suggestions.join("\n") : t("form.aiUnavailable"));
  }

  if (requestNumber !== null) {
    return (
      <div className="rounded-2xl border bg-card/85 p-8 text-center shadow-xl shadow-black/5 backdrop-blur-md dark:bg-card/70 dark:shadow-black/35">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-7" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{t("success.title")}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          {t("success.description", { workspaceName: pageData.workspace.name })}
        </p>
        {attachmentWarnings.length > 0 ? (
          <p className="mx-auto mt-4 max-w-md text-xs text-amber-700 dark:text-amber-300">
            {t("form.attachmentWarnings", { count: attachmentWarnings.length })}
          </p>
        ) : null}
        {requestNumber && (
          <div className="mx-auto mt-6 max-w-xs rounded-xl border border-primary/20 bg-primary/10 px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-widest text-primary/80">
              {t("success.requestNumberLabel")}
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-foreground">
              {requestNumber}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {t("success.requestNumberHint")}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full min-w-0 max-w-full rounded-2xl border bg-card/85 p-5 shadow-xl shadow-black/5 backdrop-blur-md md:p-6 dark:bg-card/70 dark:shadow-black/35"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-foreground">{t("form.title")}</h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{t("form.description")}</p>
        </div>
        <div className="-mt-0.5 shrink-0 pr-0.5">
          <ThemeToggle
            compact
            className="size-9 rounded-xl border-border/60 bg-card/40 p-0 shadow-none opacity-55 transition-opacity hover:opacity-100"
          />
        </div>
      </div>

      <input
        tabIndex={-1}
        autoComplete="off"
        value={companyWebsite}
        onChange={(event) => setCompanyWebsite(event.target.value)}
        className="hidden"
        aria-hidden="true"
      />

      <div className="mt-6">
        <EstimateRequestFormFields
          locale={locale}
          fields={pageData.fields}
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
          attachmentAvailability={pageData.attachmentAvailability}
          attachmentFiles={attachmentFiles}
          onAttachmentFilesChange={setAttachmentFiles}
          disabled={isSubmitting}
        />
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {uploadProgress !== null ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {t("form.uploading", { percent: uploadProgress })}
        </p>
      ) : null}
      {aiMessage ? <p className="mt-4 whitespace-pre-line text-sm text-foreground/80">{aiMessage}</p> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-primary-foreground shadow-lg shadow-primary/15 hover:from-primary/95 hover:to-indigo-500/95"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          {t("form.submit")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => void handleAiCheck()}
          className="h-11 rounded-xl"
        >
          <Bot className="size-4 text-primary" />
          {t("form.checkAi")}
        </Button>
      </div>

      <p className="mt-4 text-[10px] leading-4 text-muted-foreground">{t("form.privacy")}</p>
    </form>
  );
}
