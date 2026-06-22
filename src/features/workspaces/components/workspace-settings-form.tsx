"use client";

import { WorkspaceAppearanceTheme } from "@prisma/client";
import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { CompanyDescriptionField } from "@/features/workspaces/components/company-description-field";
import { WorkspaceLogoField } from "@/features/workspaces/components/workspace-logo-field";
import {
  WorkspaceIconPicker,
  type WorkspaceIconKey,
} from "@/features/workspaces/components/workspace-icon-picker";
import { WorkspaceThemePicker } from "@/features/workspaces/components/workspace-theme-picker";
import { updateWorkspaceProfileAction } from "@/features/workspaces/server/actions";
import { updateWorkspaceProfileSchema } from "@/features/workspaces/schemas/update-workspace-profile";
import type { Locale } from "@/lib/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function WorkspaceSettingsForm({
  workspaceId,
  initialName,
  initialCompanyDescription,
  initialLogoUrl,
  appearanceTheme,
  onAppearanceThemeChange,
  onPendingChange,
  themePickerDisabled = false,
  locale,
}: {
  workspaceId: string;
  initialName: string;
  initialCompanyDescription: string;
  initialLogoUrl: string | null;
  appearanceTheme: WorkspaceAppearanceTheme;
  onAppearanceThemeChange: (theme: WorkspaceAppearanceTheme) => void;
  onPendingChange?: (pending: boolean) => void;
  themePickerDisabled?: boolean;
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
    <form onSubmit={handleSubmit} className="mb-8">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>{t("basicInfo.title")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
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
                <p className="text-sm text-muted-foreground">{t("basicInfo.nameHint")}</p>
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
            </div>

            <div className="space-y-6">
              <WorkspaceLogoField
                workspaceId={workspaceId}
                initialLogoUrl={initialLogoUrl}
                locale={locale}
                variant="settings"
              />

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label>{t("appearanceLabel")}</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={t("basicInfo.accentHint")}
                        >
                          <Info className="size-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        {t("basicInfo.accentHint")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <WorkspaceThemePicker
                  value={appearanceTheme}
                  onChange={onAppearanceThemeChange}
                  disabled={isPending || themePickerDisabled}
                  variant="header"
                />
              </div>
            </div>
          </div>

          {error ? (
            <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {saved ? (
            <p className="mt-4 text-sm text-muted-foreground">{t("saved")}</p>
          ) : null}

          <div className="mt-6">
            <Button type="submit" className="rounded-lg" disabled={isPending}>
              {isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
