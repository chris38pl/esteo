"use client";

import { useState } from "react";
import { FileText, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const dismissButtonClassName =
  "inline-flex min-h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground";

interface EstimateConfigurationSourceBannerProps {
  templateName: string | null;
}

export function EstimateConfigurationSourceBanner({
  templateName,
}: EstimateConfigurationSourceBannerProps) {
  const t = useTranslations("estimates");
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/60">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className={cn(dismissButtonClassName, "absolute top-2 right-2 z-10")}
        aria-label={t("configurationSource.dismiss")}
      >
        <X className="size-4" aria-hidden />
      </button>

      <div className="p-5 pr-14">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <FileText className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-base font-semibold">{t("configurationSource.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("configurationSource.template", {
                name: templateName ?? t("configurationSource.none"),
              })}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
