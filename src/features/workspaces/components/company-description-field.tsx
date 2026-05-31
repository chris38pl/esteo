"use client";

import { useTranslations } from "next-intl";

import { COMPANY_DESCRIPTION_MAX_LENGTH } from "@/features/workspaces/schemas/company-description";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const textareaClassName = cn(
  "min-h-[120px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm dark:bg-input/30",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

type CompanyDescriptionFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function CompanyDescriptionField({
  id,
  value,
  onChange,
  disabled = false,
}: CompanyDescriptionFieldProps) {
  const t = useTranslations("workspaces.companyDescription");

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{t("label")}</Label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("placeholder")}
        maxLength={COMPANY_DESCRIPTION_MAX_LENGTH}
        rows={5}
        disabled={disabled}
        className={textareaClassName}
      />
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{t("helper")}</p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {t("charCounter", {
            count: value.length,
            max: COMPANY_DESCRIPTION_MAX_LENGTH,
          })}
        </p>
      </div>
    </div>
  );
}
