"use client";

import { WorkspaceAppearanceTheme } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { CompanyDescriptionField } from "@/features/workspaces/components/company-description-field";
import { WorkspaceLogoField } from "@/features/workspaces/components/workspace-logo-field";
import {
  WorkspaceIconPicker,
  type WorkspaceIconKey,
} from "@/features/workspaces/components/workspace-icon-picker";
import { updateWorkspaceProfileAction } from "@/features/workspaces/server/actions";
import { updateWorkspaceProfileSchema } from "@/features/workspaces/schemas/update-workspace-profile";
import type { Locale } from "@/lib/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WorkspaceSettingsForm({
  workspaceId,
  initialName,
  initialCompanyDescription,
  initialLogoUrl,
  appearanceTheme,
  onPendingChange,
  locale,
}: {
  workspaceId: string;
  initialName: string;
  initialCompanyDescription: string;
  initialLogoUrl: string | null;
  appearanceTheme: WorkspaceAppearanceTheme;
  onPendingChange?: (pending: boolean) => void;
  locale: Locale;
}) {
  const t = useTranslations("workspaces.settings");
  const tForm = useTranslations("workspaces.createForm");
  const tErrors = useTranslations("workspaces.errors");
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [workspaceIcon, setWorkspaceIcon] = useState<WorkspaceIconKey>("building");
  const [companyDescription, setCompanyDescription] = useState(initialCompanyDescription);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const parsed = updateWorkspaceProfileSchema.safeParse({
      name,
      appearanceTheme,
      companyDescription: companyDescription.trim() || null,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? tErrors("generic"));
      return;
    }

    startTransition(async () => {
      const result = await updateWorkspaceProfileAction(
        workspaceId,
        parsed.data,
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
      <div className="space-y-2">
        <Label htmlFor="workspace-settings-name">{tForm("nameLabel")}</Label>
        <Input
          id="workspace-settings-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={tForm("namePlaceholder")}
          required
          autoComplete="organization"
          disabled={isPending}
          className="h-11 rounded-xl"
        />
      </div>

      <WorkspaceIconPicker
        value={workspaceIcon}
        onChange={setWorkspaceIcon}
        disabled={isPending}
      />

      <CompanyDescriptionField
        id="workspace-settings-company-description"
        value={companyDescription}
        onChange={setCompanyDescription}
        disabled={isPending}
        variant="create"
      />

      <WorkspaceLogoField
        workspaceId={workspaceId}
        initialLogoUrl={initialLogoUrl}
        locale={locale}
      />

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
