"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

interface ActivationFormHeroBadgeProps {
  className?: string;
  /** Compact layout for the guide banner header (content-width, subtle). */
  layout?: "default" | "banner";
}

export function ActivationFormHeroBadge({
  className,
  layout = "default",
}: ActivationFormHeroBadgeProps) {
  const t = useTranslations("activation.formBadge");

  const title = t("readyTitle");
  const description = t("readyDescription");

  const isBanner = layout === "banner";

  return (
    <div
      className={cn(
        "rounded-md border",
        isBanner
          ? "w-fit max-w-full border-emerald-500/20 bg-emerald-500/[0.07] px-2 py-0.5 dark:border-emerald-500/25 dark:bg-emerald-500/10"
          : "mt-3 border-emerald-200/60 bg-emerald-50/80 px-3 py-2 dark:border-emerald-900/40 dark:bg-emerald-950/30",
        className,
      )}
    >
      <p
        className={cn(
          "leading-snug",
          isBanner
            ? "text-[10px] font-medium text-emerald-800 dark:text-emerald-200/90"
            : "text-sm font-medium text-emerald-900 dark:text-emerald-100",
        )}
      >
        <span aria-hidden className="mr-0.5 text-[10px]">
          ✨
        </span>
        {title}
      </p>
      <p
        className={cn(
          "leading-snug",
          isBanner
            ? "text-[9px] text-emerald-700/85 dark:text-emerald-300/70"
            : "mt-0.5 text-xs text-emerald-800/90 dark:text-emerald-200/90",
        )}
      >
        {description}
      </p>
    </div>
  );
}
