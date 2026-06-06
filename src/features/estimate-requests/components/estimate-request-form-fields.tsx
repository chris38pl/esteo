"use client";

import { MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { AttachmentDropzonePlaceholder } from "@/features/estimate-requests/components/attachment-dropzone-placeholder";
import { IndustryFieldInput } from "@/features/estimate-requests/components/industry-field-input";
import { VOIVODESHIP_KEYS, getVoivodeshipLabel } from "@/features/estimate-requests/config/voivodeships";
import { START_DATE_KEYS, getStartDateLabel } from "@/features/estimate-requests/config/start-dates";
import type { IndustryFieldForDocument } from "@/features/industry-fields/server/get-fields-for-workspace";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type IndustryFieldValue = string | number | boolean | null;

export type EstimateRequestCustomerForm = {
  fullName: string;
  email: string;
  phone: string;
};

export type EstimateRequestAddressForm = {
  streetAddress: string;
  city: string;
  postalCode: string;
  voivodeship: string;
};

export type EstimateRequestProjectForm = {
  preferredStartDate: string;
  description: string;
};

export const estimateRequestLabelClassName =
  "text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground";

export const estimateRequestFieldClassName =
  "h-10 rounded-xl border-input bg-background/80 shadow-xs dark:bg-input/30";

export function createEmptyIndustryFieldValues(
  fields: IndustryFieldForDocument[],
): Record<string, IndustryFieldValue> {
  return Object.fromEntries(fields.map((field) => [field.key, ""]));
}

export function EstimateRequestFormFields({
  locale,
  fields,
  title,
  onTitleChange,
  showTitle = false,
  customer,
  onCustomerChange,
  address,
  onAddressChange,
  project,
  onProjectChange,
  industryFields,
  onIndustryFieldChange,
  showAttachments = true,
  disabled = false,
}: {
  locale: Locale;
  fields: IndustryFieldForDocument[];
  title?: string;
  onTitleChange?: (value: string) => void;
  showTitle?: boolean;
  customer: EstimateRequestCustomerForm;
  onCustomerChange: (value: EstimateRequestCustomerForm) => void;
  address: EstimateRequestAddressForm;
  onAddressChange: (value: EstimateRequestAddressForm) => void;
  project: EstimateRequestProjectForm;
  onProjectChange: (value: EstimateRequestProjectForm) => void;
  industryFields: Record<string, IndustryFieldValue>;
  onIndustryFieldChange: (key: string, value: IndustryFieldValue) => void;
  showAttachments?: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("estimateRequests");
  const tCreate = useTranslations("estimates.create");

  const primaryFields = useMemo(
    () => fields.filter((field) => field.key === "property_type"),
    [fields],
  );
  const secondaryFields = useMemo(
    () => fields.filter((field) => field.key !== "property_type"),
    [fields],
  );

  return (
    <div className="min-w-0 space-y-5">
      {showTitle ? (
        <EstimateRequestTextInput
          id="internal-estimate-title"
          label={tCreate("titleLabel")}
          placeholder={tCreate("titlePlaceholder")}
          value={title ?? ""}
          onChange={(value) => onTitleChange?.(value)}
          disabled={disabled}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <EstimateRequestTextInput
          id="estimate-full-name"
          label={t("form.fields.fullName")}
          placeholder={t("form.placeholders.fullName")}
          value={customer.fullName}
          onChange={(value) => onCustomerChange({ ...customer, fullName: value })}
          required
          disabled={disabled}
        />
        <EstimateRequestTextInput
          id="estimate-email"
          type="email"
          label={t("form.fields.email")}
          placeholder={t("form.placeholders.email")}
          value={customer.email}
          onChange={(value) => onCustomerChange({ ...customer, email: value })}
          required
          disabled={disabled}
        />
        <EstimateRequestTextInput
          id="estimate-phone"
          label={t("form.fields.phone")}
          placeholder={t("form.placeholders.phone")}
          value={customer.phone}
          onChange={(value) => onCustomerChange({ ...customer, phone: value })}
          required
          disabled={disabled}
        />
        {secondaryFields.map((field) => (
          <IndustryFieldInput
            key={field.key}
            field={field}
            value={industryFields[field.key] ?? ""}
            onChange={onIndustryFieldChange}
            locale={locale}
            selectPlaceholder={t("form.selectPlaceholder")}
            disabled={disabled}
          />
        ))}
      </div>

      <div className="space-y-4">
        <EstimateRequestTextInput
          id="estimate-address"
          label={t("form.fields.streetAddress")}
          placeholder={t("form.placeholders.streetAddress")}
          value={address.streetAddress}
          onChange={(value) => onAddressChange({ ...address, streetAddress: value })}
          icon={<MapPin className="size-4" />}
          required
          disabled={disabled}
        />
        <div className="grid gap-3 sm:grid-cols-[1fr_0.8fr_0.9fr]">
          <EstimateRequestTextInput
            id="estimate-city"
            ariaLabel={t("form.fields.city")}
            placeholder={t("form.placeholders.city")}
            value={address.city}
            onChange={(value) => onAddressChange({ ...address, city: value })}
            required
            disabled={disabled}
          />
          <EstimateRequestTextInput
            id="estimate-postal-code"
            ariaLabel={t("form.fields.postalCode")}
            placeholder={t("form.placeholders.postalCode")}
            value={address.postalCode}
            onChange={(value) => onAddressChange({ ...address, postalCode: value })}
            required
            disabled={disabled}
          />
          <div className="space-y-2">
            <select
              id="estimate-voivodeship"
              value={address.voivodeship}
              onChange={(event) =>
                onAddressChange({ ...address, voivodeship: event.target.value })
              }
              required
              disabled={disabled}
              className={cn(
                estimateRequestFieldClassName,
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
        <div className="space-y-4">
          {primaryFields.map((field) => (
            <IndustryFieldInput
              key={field.key}
              field={field}
              value={industryFields[field.key] ?? ""}
              onChange={onIndustryFieldChange}
              locale={locale}
              selectPlaceholder={t("form.selectPlaceholder")}
              disabled={disabled}
            />
          ))}
        </div>
      ) : null}

      <div className="space-y-3">
        <Label className={estimateRequestLabelClassName}>
          {t("form.fields.preferredStartDate")}
          <span className="text-primary">*</span>
        </Label>
        <div className="flex w-full min-w-0 max-w-full gap-2 overflow-x-auto pb-1">
          {START_DATE_KEYS.map((option) => {
            const selected = project.preferredStartDate === option;
            return (
              <button
                key={option}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onProjectChange({ ...project, preferredStartDate: option })
                }
                className={cn(
                  "shrink-0 rounded-xl border px-3 py-2 text-[11px] font-semibold transition",
                  "border-input bg-background/70 text-muted-foreground hover:bg-accent hover:text-foreground dark:bg-input/20",
                  !disabled && "cursor-pointer",
                  selected && "border-primary/50 bg-primary/10 text-foreground",
                )}
              >
                {getStartDateLabel(option, locale)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="estimate-description" className={estimateRequestLabelClassName}>
          {t("form.fields.description")}
          <span className="text-primary">*</span>
        </Label>
        <textarea
          id="estimate-description"
          value={project.description}
          onChange={(event) =>
            onProjectChange({ ...project, description: event.target.value })
          }
          required
          minLength={20}
          maxLength={4000}
          disabled={disabled}
          placeholder={t("form.placeholders.description")}
          className={cn(
            "min-h-28 w-full resize-y rounded-xl border border-input bg-background/80 px-3 py-3 text-sm text-foreground shadow-xs outline-none dark:bg-input/30",
            "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
        {showTitle ? (
          <p className="text-xs text-muted-foreground">{tCreate("descriptionHint")}</p>
        ) : null}
      </div>

      {showAttachments ? (
        <div className="space-y-2">
          <Label className={estimateRequestLabelClassName}>{t("attachments.label")}</Label>
          <AttachmentDropzonePlaceholder />
        </div>
      ) : null}
    </div>
  );
}

function EstimateRequestTextInput({
  id,
  label,
  ariaLabel,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  icon,
  disabled,
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
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      {label ? (
        <Label htmlFor={id} className={estimateRequestLabelClassName}>
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
          disabled={disabled}
          className={cn(estimateRequestFieldClassName, icon && "pl-9")}
        />
      </div>
    </div>
  );
}
