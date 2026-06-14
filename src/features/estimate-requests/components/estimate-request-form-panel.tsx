"use client";

import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  EstimateRequestFormFields,
} from "@/features/estimate-requests/components/estimate-request-form-fields";
import type { useEstimateRequestFormState } from "@/features/estimate-requests/hooks/use-estimate-request-form-state";
import type { PublicEstimateRequestPageData } from "@/features/estimate-requests/server/public-service";
import type { Locale } from "@/lib/locale";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type FormState = ReturnType<typeof useEstimateRequestFormState>;

const SUCCESS_REDIRECT_DELAY_MS = 2_500;

export function EstimateRequestFormPanel({
  locale,
  pageData,
  formState,
  redirectToEstimateOnSuccess = false,
}: {
  locale: Locale;
  pageData: PublicEstimateRequestPageData;
  formState: FormState;
  redirectToEstimateOnSuccess?: boolean;
}) {
  const router = useRouter();
  const {
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
    estimateId,
    queuedForManual,
    isSubmitting,
    uploadProgress,
    attachmentWarnings,
    error,
    handleSubmit,
  } = formState;

  useEffect(() => {
    if (!redirectToEstimateOnSuccess || requestNumber === null || !estimateId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.push(
        `/${locale}/dashboard/${pageData.workspace.slug}/estimates/${estimateId}`,
      );
    }, SUCCESS_REDIRECT_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [
    estimateId,
    locale,
    pageData.workspace.slug,
    redirectToEstimateOnSuccess,
    requestNumber,
    router,
  ]);

  if (requestNumber !== null) {
    return (
      <div className="rounded-2xl border bg-card/85 p-8 text-center shadow-xl shadow-black/5 backdrop-blur-md dark:bg-card/70 dark:shadow-black/35">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-7" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{t("success.title")}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          {queuedForManual
            ? t("success.descriptionQueued", { workspaceName: pageData.workspace.name })
            : t("success.description", { workspaceName: pageData.workspace.name })}
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

      <div className="mt-6 space-y-6">
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

      <div className="mt-5">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl text-base font-medium"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          {t("form.submit")}
        </Button>
      </div>

      <p className="mt-4 text-[10px] leading-4 text-muted-foreground">{t("form.privacy")}</p>
    </form>
  );
}
