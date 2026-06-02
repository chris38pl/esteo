"use client";

import { ArrowRight, Bot, CheckCircle2, Loader2, MapPin } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { AttachmentDropzonePlaceholder } from "@/features/estimate-requests/components/attachment-dropzone-placeholder";
import { IndustryFieldInput } from "@/features/estimate-requests/components/industry-field-input";
import { VOIVODESHIP_KEYS, getVoivodeshipLabel } from "@/features/estimate-requests/config/voivodeships";
import { START_DATE_KEYS, getStartDateLabel } from "@/features/estimate-requests/config/start-dates";
import { publicEstimateRequestSchema } from "@/features/estimate-requests/schemas/request";
import { checkEstimateRequestWithAiAction, submitPublicEstimateRequestAction } from "@/features/estimate-requests/server/public-actions";
import type { PublicEstimateRequestPageData } from "@/features/estimate-requests/server/public-service";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type IndustryValue = string | number | boolean | null;

const FORM_ERROR_MESSAGES = {
  invalid: "form.errors.invalid",
  rate_limited: "form.errors.rate_limited",
  captcha_failed: "form.errors.captcha_failed",
  unavailable: "form.errors.unavailable",
} as const satisfies Record<string, `form.errors.${string}`>;

const labelClassName =
  "text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground";

const fieldClassName =
  "h-10 rounded-xl border-input bg-background/80 shadow-xs dark:bg-input/30";

export function EstimateRequestForm({
  locale,
  pageData,
}: {
  locale: Locale;
  pageData: PublicEstimateRequestPageData;
}) {
  const t = useTranslations("estimateRequests");
  const [isPending, startTransition] = useTransition();
  const [customer, setCustomer] = useState({ fullName: "", email: "", phone: "" });
  const [address, setAddress] = useState({
    streetAddress: "",
    city: "",
    postalCode: "",
    voivodeship: "",
  });
  const [project, setProject] = useState({
    preferredStartDate: "asap",
    description: "",
  });
  const [industryFields, setIndustryFields] = useState<Record<string, IndustryValue>>(() =>
    Object.fromEntries(pageData.fields.map((field) => [field.key, ""])),
  );
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [requestNumber, setRequestNumber] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const primaryFields = useMemo(
    () => pageData.fields.filter((field) => field.key === "property_type"),
    [pageData.fields],
  );
  const secondaryFields = useMemo(
    () => pageData.fields.filter((field) => field.key !== "property_type"),
    [pageData.fields],
  );

  function updateIndustryField(key: string, value: IndustryValue) {
    setIndustryFields((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setAiMessage(null);

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
      setError(t("form.errors.invalid"));
      return;
    }

    startTransition(async () => {
      const result = await submitPublicEstimateRequestAction(parsed.data, locale);

      if (!result.success) {
        setError(t(FORM_ERROR_MESSAGES[result.error]));
        return;
      }

      setRequestNumber(result.data.requestNumber);
    });
  }

  function handleAiCheck() {
    setAiMessage(null);
    startTransition(async () => {
      const result = await checkEstimateRequestWithAiAction();
      setAiMessage(result.success ? result.data.suggestions.join("\n") : t("form.aiUnavailable"));
    });
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
      className="rounded-2xl border bg-card/85 p-5 shadow-xl shadow-black/5 backdrop-blur-md md:p-6 dark:bg-card/70 dark:shadow-black/35"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <TextInput
          id="estimate-full-name"
          label={t("form.fields.fullName")}
          placeholder={t("form.placeholders.fullName")}
          value={customer.fullName}
          onChange={(value) => setCustomer((current) => ({ ...current, fullName: value }))}
          required
        />
        <TextInput
          id="estimate-email"
          type="email"
          label={t("form.fields.email")}
          placeholder={t("form.placeholders.email")}
          value={customer.email}
          onChange={(value) => setCustomer((current) => ({ ...current, email: value }))}
          required
        />
        <TextInput
          id="estimate-phone"
          label={t("form.fields.phone")}
          placeholder={t("form.placeholders.phone")}
          value={customer.phone}
          onChange={(value) => setCustomer((current) => ({ ...current, phone: value }))}
          required
        />
        {secondaryFields.map((field) => (
          <IndustryFieldInput
            key={field.key}
            field={field}
            value={industryFields[field.key] ?? ""}
            onChange={updateIndustryField}
            locale={locale}
            selectPlaceholder={t("form.selectPlaceholder")}
          />
        ))}
      </div>

      <div className="mt-5 space-y-4">
        <TextInput
          id="estimate-address"
          label={t("form.fields.streetAddress")}
          placeholder={t("form.placeholders.streetAddress")}
          value={address.streetAddress}
          onChange={(value) => setAddress((current) => ({ ...current, streetAddress: value }))}
          icon={<MapPin className="size-4" />}
          required
        />
        <div className="grid gap-3 sm:grid-cols-[1fr_0.8fr_0.9fr]">
          <TextInput
            id="estimate-city"
            ariaLabel={t("form.fields.city")}
            placeholder={t("form.placeholders.city")}
            value={address.city}
            onChange={(value) => setAddress((current) => ({ ...current, city: value }))}
            required
          />
          <TextInput
            id="estimate-postal-code"
            ariaLabel={t("form.fields.postalCode")}
            placeholder={t("form.placeholders.postalCode")}
            value={address.postalCode}
            onChange={(value) => setAddress((current) => ({ ...current, postalCode: value }))}
            required
          />
          <div className="space-y-2">
            <select
              id="estimate-voivodeship"
              value={address.voivodeship}
              onChange={(event) =>
                setAddress((current) => ({ ...current, voivodeship: event.target.value }))
              }
              required
              className={cn(
                fieldClassName,
                "w-full appearance-none px-3 text-sm outline-none",
                !address.voivodeship && "text-muted-foreground",
                address.voivodeship && "text-foreground",
              )}
              aria-label={t("form.fields.voivodeship")}
            >
              <option value="">{t("form.placeholders.voivodeship")}</option>
              {VOIVODESHIP_KEYS.map((voivodeship) => (
                <option key={voivodeship} value={voivodeship}>
                  {getVoivodeshipLabel(voivodeship, locale)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {primaryFields.length > 0 ? (
        <div className="mt-5 space-y-4">
          {primaryFields.map((field) => (
            <IndustryFieldInput
              key={field.key}
              field={field}
              value={industryFields[field.key] ?? ""}
              onChange={updateIndustryField}
              locale={locale}
              selectPlaceholder={t("form.selectPlaceholder")}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        <Label className={labelClassName}>
          {t("form.fields.preferredStartDate")}
          <span className="text-primary">*</span>
        </Label>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {START_DATE_KEYS.map((option) => {
            const selected = project.preferredStartDate === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setProject((current) => ({ ...current, preferredStartDate: option }))}
                className={cn(
                  "shrink-0 rounded-xl border px-3 py-2 text-[11px] font-semibold transition",
                  "border-input bg-background/70 text-muted-foreground hover:bg-accent hover:text-foreground dark:bg-input/20 cursor-pointer",
                  selected && "border-primary/50 bg-primary/10 dark:bg-primary/10 text-foreground",
                )}
              >
                {getStartDateLabel(option, locale)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <Label htmlFor="estimate-description" className={labelClassName}>
          {t("form.fields.description")}
          <span className="text-primary">*</span>
        </Label>
        <textarea
          id="estimate-description"
          value={project.description}
          onChange={(event) =>
            setProject((current) => ({ ...current, description: event.target.value }))
          }
          required
          minLength={20}
          maxLength={4000}
          placeholder={t("form.placeholders.description")}
          className={cn(
            "min-h-28 w-full resize-y rounded-xl border border-input bg-background/80 px-3 py-3 text-sm text-foreground shadow-xs outline-none dark:bg-input/30",
            "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          )}
        />
      </div>

      <div className="mt-5 space-y-2">
        <Label className={labelClassName}>{t("attachments.label")}</Label>
        <AttachmentDropzonePlaceholder />
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {aiMessage ? <p className="mt-4 whitespace-pre-line text-sm text-foreground/80">{aiMessage}</p> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button
          type="submit"
          disabled={isPending}
          className="h-11 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-primary-foreground shadow-lg shadow-primary/15 hover:from-primary/95 hover:to-indigo-500/95"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          {t("form.submit")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={handleAiCheck}
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

function TextInput({
  id,
  label,
  ariaLabel,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  icon,
}: {
  id: string;
  label?: string;
  ariaLabel?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      {label ? (
        <Label htmlFor={id} className={labelClassName}>
          {label}
          {required ? <span className="text-primary">*</span> : null}
        </Label>
      ) : null}
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        ) : null}
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={ariaLabel ?? label}
          placeholder={placeholder}
          required={required}
          className={cn(fieldClassName, icon && "pl-9")}
        />
      </div>
    </div>
  );
}
