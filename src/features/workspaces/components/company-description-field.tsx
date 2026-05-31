"use client";

import { useTranslations } from "next-intl";

import { COMPANY_DESCRIPTION_MAX_LENGTH } from "@/features/workspaces/schemas/company-description";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const textareaClassName = cn(
  "min-h-[120px] w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm dark:bg-input/30",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

type CompanyDescriptionFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  variant?: "default" | "create";
};

export function CompanyDescriptionField({
  id,
  value,
  onChange,
  disabled = false,
  variant = "default",
}: CompanyDescriptionFieldProps) {
  const t = useTranslations("workspaces.companyDescription");
  const isCreate = variant === "create";

  const counter = (
    <span className="text-xs tabular-nums text-muted-foreground">
      {t("charCounterSpaced", {
        count: value.length,
        max: COMPANY_DESCRIPTION_MAX_LENGTH,
      })}
    </span>
  );

  return (
    <div className="space-y-2">
      <div
        className={cn(
          variant === "create" && "flex items-start justify-between gap-3",
        )}
      >
        <Label htmlFor={id} className={variant === "create" ? "leading-snug" : undefined}>
          {t("label")}
        </Label>
        {variant === "create" ? counter : null}
      </div>

      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t(isCreate ? "placeholderCreate" : "placeholder")}
        maxLength={COMPANY_DESCRIPTION_MAX_LENGTH}
        rows={5}
        disabled={disabled}
        className={textareaClassName}
      />

      {!isCreate ? (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-muted-foreground">{t("helper")}</p>
          {counter}
        </div>
      ) : null}
    </div>
  );
}
