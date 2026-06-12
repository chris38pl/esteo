"use client";

import { Mic } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function VoiceIntakeFooterBar({
  onClick,
  disabled,
  className,
  floating = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  /** Elevated card over hero imagery — same bar shape as the create-estimate modal footer. */
  floating?: boolean;
}) {
  const t = useTranslations("voiceIntake.trigger");

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        floating
          ? "w-full shadow-xl shadow-black/5 backdrop-blur-md dark:shadow-black/35"
          : "flex-1",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{t("label")}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("hint")}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={onClick}
        className="h-10 shrink-0 cursor-pointer rounded-xl border-primary/30 bg-background px-4"
      >
        <Mic className="size-4 text-primary" />
        {t("label")}
      </Button>
    </div>
  );
}
