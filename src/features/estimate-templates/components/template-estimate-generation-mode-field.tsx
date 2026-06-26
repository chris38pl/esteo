"use client";

import { ClipboardList, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";
import type { TemplateGenerationMode } from "@/features/estimate-templates/lib/template-generation-mode";
import { cn } from "@/lib/utils";

const OPTIONS = [
  {
    value: "CONSERVATIVE" as const,
    icon: ClipboardList,
    recommended: false,
  },
  {
    value: "SMART" as const,
    icon: Sparkles,
    recommended: true,
  },
] as const;

export function TemplateEstimateGenerationModeField({
  value,
  onChange,
  disabled = false,
}: {
  value: TemplateGenerationMode;
  onChange: (value: TemplateGenerationMode) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("workspaces.configuration.templates.generationMode");

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-semibold">{t("title")}</Label>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <div
        className="grid gap-3 sm:grid-cols-2"
        role="radiogroup"
        aria-label={t("title")}
      >
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          const titleKey =
            option.value === "CONSERVATIVE" ? "standardEstimateTitle" : "smartSelectionTitle";
          const hintKey =
            option.value === "CONSERVATIVE" ? "standardEstimateHint" : "smartSelectionHint";
          const audienceKey =
            option.value === "CONSERVATIVE"
              ? "standardEstimateAudience"
              : "smartSelectionAudience";

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-xl border p-4 text-left transition-colors",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/70 hover:border-primary/40",
                disabled && "pointer-events-none opacity-60",
              )}
            >
              <div className="flex gap-3">
                <option.icon
                  className={cn(
                    "mt-0.5 size-5 shrink-0",
                    selected ? "text-primary" : "text-muted-foreground",
                  )}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {t(titleKey)}
                    {option.recommended ? (
                      <span className="ml-1.5 text-xs font-semibold text-primary">
                        {t("recommendedBadge")}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {t(hintKey)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground/90">{t(audienceKey)}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
