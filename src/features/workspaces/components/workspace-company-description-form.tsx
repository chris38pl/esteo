"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { CompanyDescriptionField } from "@/features/workspaces/components/company-description-field";
import { updateWorkspaceSettingsAction } from "@/features/workspaces/server/actions";
import type { Locale } from "@/lib/locale";
import { Button } from "@/components/ui/button";

export function WorkspaceCompanyDescriptionForm({
  workspaceId,
  initialCompanyDescription,
  locale,
}: {
  workspaceId: string;
  initialCompanyDescription: string;
  locale: Locale;
}) {
  const t = useTranslations("workspaces.settings");
  const router = useRouter();
  const [companyDescription, setCompanyDescription] = useState(initialCompanyDescription);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateWorkspaceSettingsAction(
        workspaceId,
        { companyDescription: companyDescription.trim() || null },
        locale,
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <CompanyDescriptionField
        id="workspace-company-description"
        value={companyDescription}
        onChange={setCompanyDescription}
        disabled={isPending}
      />

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {saved ? (
        <p className="text-sm text-muted-foreground">{t("saved")}</p>
      ) : null}

      <Button type="submit" className="rounded-lg" disabled={isPending}>
        {isPending ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
