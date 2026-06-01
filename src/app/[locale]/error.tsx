"use client";

import { useTranslations } from "next-intl";

import { DatabaseUnavailableState } from "@/components/database/database-unavailable-state";
import { Button } from "@/components/ui/button";
import { isDatabaseUnavailable } from "@/lib/database/is-database-unavailable";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  if (isDatabaseUnavailable(error)) {
    return (
      <main className="surface-base flex flex-1 items-center justify-center px-6 py-16">
        <DatabaseUnavailableState onRetry={() => reset()} />
      </main>
    );
  }

  return (
    <main className="surface-base flex flex-1 items-center justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-border/60 bg-card p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold tracking-tight">{t("errors.genericTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("errors.genericDescription")}</p>
        <Button type="button" className="w-full" onClick={() => reset()}>
          {t("databaseUnavailable.retry")}
        </Button>
      </div>
    </main>
  );
}
