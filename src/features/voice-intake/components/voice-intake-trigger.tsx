"use client";

import { Mic } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function VoiceIntakeTrigger({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  const t = useTranslations("voiceIntake.trigger");

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{t("label")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("hint")}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={onClick}
          className="h-11 shrink-0 cursor-pointer rounded-xl border-primary/30 bg-background"
        >
          <Mic className="size-4 text-primary" />
          {t("label")}
        </Button>
      </div>
    </div>
  );
}
