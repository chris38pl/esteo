"use client";

import { ArrowRight, Loader2, MapPin, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { HeroPhoneRequestAttachments } from "@/features/marketing/components/hero/hero-phone-request-attachments";
import { heroPhonePrimaryButtonClassName } from "@/features/marketing/components/hero/hero-phone-button-styles";
import { cn } from "@/lib/utils";

const labelClassName =
  "text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground";

export function HeroPhoneRequestScreen({
  clientName,
  address,
  description,
  attachment,
  submitHighlighted,
  isSubmitting,
}: {
  clientName: string;
  address: string;
  description: string;
  attachment: { name: string; sizeLabel: string };
  submitHighlighted: boolean;
  isSubmitting: boolean;
}) {
  const t = useTranslations("estimateRequests");

  return (
    <div className="hero-phone-request flex h-full flex-col overflow-hidden pb-5 pl-[11px] pr-2 pt-8">
      <div className="px-0.5">
        <div className="mb-7">
          <h2 className="pb-4 text-[12px] font-bold leading-tight text-foreground">{t("form.title")}</h2>
          <p className="text-[10px] leading-5 text-muted-foreground">{t("form.description")}</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className={labelClassName}>
              {t("form.fields.fullName")}
              <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <User className="size-3.5" />
              </span>
              <input
                readOnly
                value={clientName}
                placeholder={t("form.placeholders.fullName")}
                className="h-8 w-full rounded-lg border border-input bg-background py-1 pl-8 pr-2.5 text-[10px] text-foreground shadow-xs outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClassName}>
              {t("form.fields.streetAddress")}
              <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <MapPin className="size-3.5" />
              </span>
              <input
                readOnly
                value={address}
                placeholder={t("form.placeholders.streetAddress")}
                className="h-8 w-full rounded-lg border border-input bg-background py-1 pl-8 pr-2.5 text-[10px] text-foreground shadow-xs outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClassName}>
              {t("form.fields.description")}
              <span className="text-primary">*</span>
            </label>
            <textarea
              readOnly
              value={description}
              placeholder={t("form.placeholders.description")}
              className={cn(
                "h-[5rem] min-h-0 w-full resize-none overflow-hidden rounded-lg border border-input bg-background px-2.5 py-2 text-[10px] leading-snug text-foreground shadow-xs outline-none",
                "placeholder:text-muted-foreground",
                description.length > 0 && "ring-1 ring-primary/25",
              )}
            />
          </div>

          <HeroPhoneRequestAttachments attachment={attachment} />
        </div>

        <div className="mt-4 pb-1">
          <Button
            type="button"
            size="sm"
            disabled={isSubmitting}
            className={cn(
              heroPhonePrimaryButtonClassName,
              "hero-phone-request-submit w-full",
              submitHighlighted && "ring-2 ring-primary/35 ring-offset-1 ring-offset-background",
            )}
          >
            {isSubmitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ArrowRight className="size-3.5" />
            )}
            {t("form.submit")}
          </Button>
        </div>
      </div>
    </div>
  );
}
