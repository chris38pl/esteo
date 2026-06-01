"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function DatabaseUnavailableState({
  onRetry,
}: {
  onRetry?: () => void;
}) {
  const t = useTranslations("common.databaseUnavailable");

  return (
    <div
      role="alert"
      className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-border/60 bg-card p-6 text-center shadow-sm"
    >
      <p className="text-sm leading-relaxed text-muted-foreground">{t("message")}</p>
      {onRetry ? (
        <Button type="button" className="w-full" onClick={onRetry}>
          {t("retry")}
        </Button>
      ) : null}
    </div>
  );
}
