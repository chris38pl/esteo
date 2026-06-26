"use client";

import { WorkspaceIndustry } from "@prisma/client";
import { MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { AttachmentDropzone } from "@/features/estimate-requests/components/attachment-dropzone-placeholder";
import type { PublicAttachmentAvailability } from "@/features/attachments/lib/attachment-availability";
import type { StagingAttachmentItem } from "@/features/attachments/lib/staging-attachment-client";
import { IndustryFieldInput } from "@/features/estimate-requests/components/industry-field-input";
import { EstimateRequestDescriptionField } from "@/features/estimate-requests/components/estimate-request-description-field";
import { parseFieldSelectConfig } from "@/features/industry-fields/lib/field-select-config";
import { VOIVODESHIP_KEYS, getVoivodeshipLabel } from "@/features/estimate-requests/config/voivodeships";
import { START_DATE_KEYS, getStartDateLabel } from "@/features/estimate-requests/config/start-dates";
import { getIndustryExperienceConfig } from "@/features/estimate-requests/config/industry-experience-config";
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
  serviceLocation?: string;
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
  return Object.fromEntries(
    fields.map((field) => {
      const selectConfig = parseFieldSelectConfig(field.options, field.key);
      if (selectConfig.selectMode === "multi") {
        return [field.key, "[]"];
      }
      return [field.key, ""];
    }),
  );
}

function primaryTileFieldKeys(industry: WorkspaceIndustry): string[] {
  if (industry === WorkspaceIndustry.CARPENTRY) {
    return ["product_categories"];
  }
  if (industry === WorkspaceIndustry.ELECTRICAL) {
    return ["building_type"];
  }
  return ["property_type"];
}

function contactRowIndustryFieldKey(industry: WorkspaceIndustry): string | null {
  if (industry === WorkspaceIndustry.CARPENTRY) {
    return "project_types";
  }
  return null;
}

export function EstimateRequestFormFields({
  locale,
  industry,
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
  attachmentAvailability,
  stagingAttachments = [],
  onStagingAddFiles,
  onStagingRemove,
  onStagingRetry,
  stagingLocalError = null,
  disabled = false,
}: {
  locale: Locale;
  industry: WorkspaceIndustry;
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
  attachmentAvailability?: PublicAttachmentAvailability;
  stagingAttachments?: StagingAttachmentItem[];
  onStagingAddFiles?: (files: FileList | null) => void;
  onStagingRemove?: (clientId: string) => void;
  onStagingRetry?: (clientId: string) => void;
  stagingLocalError?: string | null;
  disabled?: boolean;
}) {
  const t = useTranslations("estimateRequests");
  const tCreate = useTranslations("estimates.create");
  const experience = getIndustryExperienceConfig(industry);
  const labelKeys = experience.form.labelKeys;
  type FormMessageKey = Parameters<typeof t>[0];
  const formLabel = (key: string) => t(key as FormMessageKey);

  const contactRowFieldKey = contactRowIndustryFieldKey(industry);

  const primaryFields = useMemo(
    () => {
      if (!experience.form.showIndustryCatalogFields) {
        return [];
      }
      const keys = new Set(primaryTileFieldKeys(industry));
      return fields.filter((field) => keys.has(field.key));
    },
    [experience.form.showIndustryCatalogFields, fields, industry],
  );
  const contactRowField = useMemo(
    () =>
      contactRowFieldKey
        ? fields.find((field) => field.key === contactRowFieldKey) ?? null
        : null,
    [contactRowFieldKey, fields],
  );
  const secondaryFields = useMemo(
    () => {
      if (!experience.form.showIndustryCatalogFields) {
        return [];
      }
      const excluded = new Set([
        ...primaryTileFieldKeys(industry),
        ...(contactRowFieldKey ? [contactRowFieldKey] : []),
      ]);
      return fields.filter((field) => !excluded.has(field.key));
    },
    [contactRowFieldKey, experience.form.showIndustryCatalogFields, fields, industry],
  );

  return (
    <div className="min-w-0 space-y-5">
      {showTitle ? (
        <div data-voice-field="title">
        <EstimateRequestTextInput
          id="internal-estimate-title"
          label={tCreate("titleLabel")}
          placeholder={tCreate("titlePlaceholder")}
          value={title ?? ""}
          onChange={(value) => onTitleChange?.(value)}
          disabled={disabled}
        />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div data-voice-field="customer.fullName">
          <EstimateRequestTextInput
            id="estimate-full-name"
            label={t("form.fields.fullName")}
            placeholder={t("form.placeholders.fullName")}
            value={customer.fullName}
            onChange={(value) => onCustomerChange({ ...customer, fullName: value })}
            required
            disabled={disabled}
          />
        </div>
        <div data-voice-field="customer.email">
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
        </div>
        <div data-voice-field="customer.phone">
          <EstimateRequestTextInput
            id="estimate-phone"
            label={t("form.fields.phone")}
            placeholder={t("form.placeholders.phone")}
            value={customer.phone}
            onChange={(value) => onCustomerChange({ ...customer, phone: value })}
            required
            disabled={disabled}
          />
        </div>
        {contactRowField ? (
          <div data-voice-field={`industryFields.${contactRowField.key}`}>
            <IndustryFieldInput
              field={contactRowField}
              value={industryFields[contactRowField.key] ?? ""}
              onChange={onIndustryFieldChange}
              locale={locale}
              selectPlaceholder={t("form.selectPlaceholder")}
              disabled={disabled}
            />
          </div>
        ) : null}
        {secondaryFields.map((field) => (
          <div key={field.key} data-voice-field={`industryFields.${field.key}`}>
            <IndustryFieldInput
              field={field}
              value={industryFields[field.key] ?? ""}
              onChange={onIndustryFieldChange}
              locale={locale}
              selectPlaceholder={t("form.selectPlaceholder")}
              disabled={disabled}
            />
          </div>
        ))}
      </div>

      {experience.form.showServiceLocation ? (
        <div data-voice-field="address.serviceLocation">
          <EstimateRequestTextInput
            id="estimate-service-location"
            label={formLabel(labelKeys.serviceLocation)}
            placeholder={formLabel(labelKeys.serviceLocationPlaceholder)}
            value={address.serviceLocation ?? ""}
            onChange={(value) => onAddressChange({ ...address, serviceLocation: value })}
            icon={<MapPin className="size-4" />}
            required
            disabled={disabled}
          />
        </div>
      ) : null}

      {experience.form.showConstructionAddress ? (
      <div className="space-y-4">
        <div data-voice-field="address.streetAddress">
          <EstimateRequestTextInput
            id="estimate-address"
            label={formLabel(labelKeys.streetAddress)}
            placeholder={t("form.placeholders.streetAddress")}
            value={address.streetAddress}
            onChange={(value) => onAddressChange({ ...address, streetAddress: value })}
            icon={<MapPin className="size-4" />}
            required
            disabled={disabled}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_0.8fr_0.9fr]">
          <div data-voice-field="address.city">
            <EstimateRequestTextInput
              id="estimate-city"
              ariaLabel={formLabel(labelKeys.city)}
              placeholder={t("form.placeholders.city")}
              value={address.city}
              onChange={(value) => onAddressChange({ ...address, city: value })}
              required
              disabled={disabled}
            />
          </div>
          <div data-voice-field="address.postalCode">
            <EstimateRequestTextInput
              id="estimate-postal-code"
              ariaLabel={formLabel(labelKeys.postalCode)}
              placeholder={t("form.placeholders.postalCode")}
              value={address.postalCode}
              onChange={(value) => onAddressChange({ ...address, postalCode: value })}
              required
              disabled={disabled}
            />
          </div>
          <div className="space-y-2" data-voice-field="address.voivodeship">
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
              aria-label={formLabel(labelKeys.voivodeship)}
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
      ) : null}

      {primaryFields.length > 0 ? (
        <div className="space-y-4">
          {primaryFields.map((field) => (
            <div key={field.key} data-voice-field={`industryFields.${field.key}`}>
              <IndustryFieldInput
                field={field}
                value={industryFields[field.key] ?? ""}
                onChange={onIndustryFieldChange}
                locale={locale}
                selectPlaceholder={t("form.selectPlaceholder")}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      ) : null}

      {experience.form.showPreferredDate ? (
      <div className="space-y-3" data-voice-field="project.preferredStartDate">
        <Label className={estimateRequestLabelClassName}>
          {formLabel(labelKeys.preferredDate)}
          <span className="text-primary">*</span>
        </Label>
        <div className="grid w-full min-w-0 grid-cols-3 gap-2 sm:flex sm:flex-wrap">
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
                  "w-full rounded-xl border px-2 py-2 text-center text-[10px] font-semibold leading-tight transition sm:w-auto sm:shrink-0 sm:px-3 sm:text-[11px]",
                  "whitespace-normal border-input bg-background/70 text-muted-foreground hover:bg-accent hover:text-foreground dark:bg-input/20",
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
      ) : null}

      <div className="space-y-2">
        <EstimateRequestDescriptionField
          locale={locale}
          label={formLabel(labelKeys.description)}
          placeholder={formLabel(labelKeys.descriptionPlaceholder)}
          project={project}
          onProjectChange={onProjectChange}
          disabled={disabled}
        />
        {showTitle ? (
          <p className="text-xs text-muted-foreground">{tCreate("descriptionHint")}</p>
        ) : null}
      </div>

      {showAttachments ? (
        <div className="space-y-2">
          <Label className={estimateRequestLabelClassName}>{t("attachments.label")}</Label>
          <AttachmentDropzone
            items={stagingAttachments}
            onAddFiles={onStagingAddFiles ?? (() => undefined)}
            onRemove={onStagingRemove ?? (() => undefined)}
            onRetry={onStagingRetry ?? (() => undefined)}
            attachmentAvailability={attachmentAvailability}
            localError={stagingLocalError}
            disabled={disabled || !onStagingAddFiles}
          />
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
