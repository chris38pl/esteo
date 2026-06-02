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

const inputClassName =
  "h-10 rounded-lg border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:border-orange-400/70 focus-visible:ring-orange-500/20";

const labelClassName = "text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300";

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
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-8 text-center shadow-2xl shadow-black/30">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-sky-500/15 text-sky-300">
          <CheckCircle2 className="size-7" />
        </div>
        <h2 className="text-2xl font-bold text-white">{t("success.title")}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
          {t("success.description", { workspaceName: pageData.workspace.name })}
        </p>
        {requestNumber && (
          <div className="mx-auto mt-6 max-w-xs rounded-xl border border-sky-500/20 bg-sky-500/10 px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-widest text-sky-300/70">
              {t("success.requestNumberLabel")}
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-sky-200">
              {requestNumber}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
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
      className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 shadow-2xl shadow-black/30 backdrop-blur md:p-6"
    >
      <div>
        <h2 className="text-xl font-bold text-white">{t("form.title")}</h2>
        <p className="mt-2 text-xs leading-5 text-slate-400">{t("form.description")}</p>
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
            label={t("form.fields.city")}
            placeholder={t("form.placeholders.city")}
            value={address.city}
            onChange={(value) => setAddress((current) => ({ ...current, city: value }))}
            required
          />
          <TextInput
            id="estimate-postal-code"
            label={t("form.fields.postalCode")}
            placeholder={t("form.placeholders.postalCode")}
            value={address.postalCode}
            onChange={(value) => setAddress((current) => ({ ...current, postalCode: value }))}
            required
          />
          <div className="space-y-2">
            <Label htmlFor="estimate-voivodeship" className={labelClassName}>
              {t("form.fields.voivodeship")}
              <span className="text-orange-400">*</span>
            </Label>
            <select
              id="estimate-voivodeship"
              value={address.voivodeship}
              onChange={(event) =>
                setAddress((current) => ({ ...current, voivodeship: event.target.value }))
              }
              required
              className={cn(inputClassName, "w-full appearance-none px-3 text-sm outline-none")}
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
          <span className="text-orange-400">*</span>
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
                  "shrink-0 rounded-lg border px-3 py-2 text-[11px] font-semibold transition",
                  "border-white/10 bg-white/[0.03] text-slate-300 hover:border-orange-400/50 hover:text-white",
                  selected && "border-orange-400 bg-orange-500/15 text-white",
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
          <span className="text-orange-400">*</span>
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
            "min-h-28 w-full resize-y rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white shadow-xs outline-none",
            "placeholder:text-slate-500 focus-visible:border-orange-400/70 focus-visible:ring-[3px] focus-visible:ring-orange-500/20",
          )}
        />
      </div>

      <div className="mt-5 space-y-2">
        <Label className={labelClassName}>{t("attachments.label")}</Label>
        <AttachmentDropzonePlaceholder />
      </div>

      {error ? <p className="mt-4 text-sm text-orange-300">{error}</p> : null}
      {aiMessage ? <p className="mt-4 text-sm text-slate-300">{aiMessage}</p> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button
          type="submit"
          disabled={isPending}
          className="h-11 rounded-lg bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          {t("form.submit")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={handleAiCheck}
          className="h-11 rounded-lg border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white"
        >
          <Bot className="size-4 text-orange-400" />
          {t("form.checkAi")}
        </Button>
      </div>

      <p className="mt-4 text-[10px] leading-4 text-slate-500">{t("form.privacy")}</p>
    </form>
  );
}

function TextInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  icon,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={labelClassName}>
        {label}
        {required ? <span className="text-orange-400">*</span> : null}
      </Label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {icon}
          </span>
        ) : null}
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          className={cn(inputClassName, icon && "pl-9")}
        />
      </div>
    </div>
  );
}
