"use client";

import { FileText, Plus, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export function HeroPhoneRequestAttachments({
  attachment,
}: {
  attachment: { name: string; sizeLabel: string };
}) {
  const t = useTranslations("estimateRequests.attachments");
  const locale = useLocale();
  const label = locale === "pl" ? "Dodaj zdjęcia" : "Add photos";

  return (
    <div className="space-y-1.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        <button
          type="button"
          tabIndex={-1}
          className={cn(
            "hero-phone-attachment-add flex h-[4.5rem] w-[4.75rem] shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-input",
            "bg-background/60 text-center shadow-xs dark:bg-input/20",
          )}
        >
          <span className="mb-1 grid size-5 place-items-center rounded-full border border-border bg-card text-muted-foreground">
            <Plus className="size-2.5" />
          </span>
          <span className="text-[9px] font-semibold leading-tight text-foreground">{t("addFile")}</span>
          <span className="mt-0.5 text-[8px] text-muted-foreground">{t("fileCount", { current: 1, max: 10 })}</span>
        </button>

        <article
          className={cn(
            "hero-phone-attachment-card flex h-[4.5rem] w-[4.75rem] shrink-0 flex-col overflow-hidden rounded-lg border border-input bg-card shadow-xs",
          )}
        >
          <div className="relative min-h-0 flex-1 bg-muted/40">
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <FileText className="size-4" />
            </div>
            <span
              className="absolute top-0.5 right-0.5 grid size-4 place-items-center rounded border border-border/60 bg-card/90 text-muted-foreground"
              aria-hidden
            >
              <X className="size-2" />
            </span>
          </div>
          <div className="shrink-0 border-t border-input bg-background/80 px-1 py-0.5 dark:bg-input/30">
            <p className="line-clamp-1 text-[8px] font-semibold leading-tight text-foreground">
              {attachment.name}
            </p>
            <p className="text-[8px] text-muted-foreground">{attachment.sizeLabel}</p>
          </div>
        </article>
      </div>
    </div>
  );
}
