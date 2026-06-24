"use client";

import { WorkspaceAppearanceTheme, type WorkspaceIndustry } from "@prisma/client";
import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { appToast } from "@/components/ui/app-toast";
import { CompanyDescriptionField } from "@/features/workspaces/components/company-description-field";
import { isServiceWorkspace } from "@/features/workspaces/lib/industries";
import { WorkspaceLogoField } from "@/features/workspaces/components/workspace-logo-field";
import { WorkspaceThemePicker } from "@/features/workspaces/components/workspace-theme-picker";
import {
  updateWorkspaceBusinessTypeAction,
  updateWorkspaceProfileAction,
} from "@/features/workspaces/server/actions";
import { updateWorkspaceProfileSchema } from "@/features/workspaces/schemas/update-workspace-profile";
import { updateWorkspaceBusinessTypeSchema } from "@/features/workspaces/schemas/business-type";
import { BUSINESS_TYPE_MAX_LENGTH } from "@/features/workspaces/schemas/business-type";
import type { Locale } from "@/lib/locale";
import { WorkspaceSettingsCard } from "@/features/workspaces/components/workspace-settings-card";
import { Button } from "@/components/ui/button";
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
  workspaceIndustry,
  industryOtherText,
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
  workspaceIndustry: WorkspaceIndustry;
  industryOtherText: string;
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
  const tAiSetup = useTranslations("workspaces.settings.aiSetup");
  const tIndustries = useTranslations("workspaces.industries");
  const tErrors = useTranslations("workspaces.errors");
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [businessType, setBusinessType] = useState(industryOtherText);
  const [companyDescription, setCompanyDescription] = useState(initialCompanyDescription);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const industryDisplay =
    isServiceWorkspace(workspaceIndustry) && industryOtherText.trim()
      ? `${tIndustries("OTHER")} — ${industryOtherText.trim()}`
      : tIndustries(workspaceIndustry);

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

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
        appToast.error(result.error);
        return;
      }

      if (isServiceWorkspace(workspaceIndustry)) {
        const businessTypeParsed = updateWorkspaceBusinessTypeSchema.safeParse({
          industryOtherText: businessType,
        });

        if (!businessTypeParsed.success) {
          const businessTypeError =
            businessTypeParsed.error.issues[0]?.message ?? tAiSetup("errors.generic");
          setError(businessTypeError);
          appToast.error(businessTypeError);
          return;
        }

        if (businessTypeParsed.data.industryOtherText !== industryOtherText.trim()) {
          const businessTypeResult = await updateWorkspaceBusinessTypeAction(
            workspaceId,
            businessTypeParsed.data,
            locale,
          );

          if (!businessTypeResult.success) {
            setError(businessTypeResult.error);
            appToast.error(businessTypeResult.error);
            return;
          }
        }
      }

      appToast.success(t("saveSuccessToast"));
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <WorkspaceSettingsCard title={t("basicInfo.title")}>
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

              <div className="space-y-2">
                <Label htmlFor="workspace-settings-industry">{tForm("industryLabel")}</Label>
                <Input
                  id="workspace-settings-industry"
                  value={tIndustries("OTHER")}
                  readOnly
                  tabIndex={-1}
                  className="h-11 rounded-xl bg-muted/40 text-foreground"
                  aria-readonly="true"
                />
                <p className="text-sm text-muted-foreground">{t("basicInfo.industryHint")}</p>
              </div>

              {isServiceWorkspace(workspaceIndustry) ? (
                <div className="space-y-2" data-ai-setup-field="businessType">
                  <Label htmlFor="workspace-business-type">{tAiSetup("businessTypeLabel")}</Label>
                  <Input
                    id="workspace-business-type"
                    value={businessType}
                    onChange={(event) => setBusinessType(event.target.value)}
                    placeholder={tAiSetup("businessTypePlaceholder")}
                    maxLength={BUSINESS_TYPE_MAX_LENGTH}
                    required
                    disabled={isPending}
                    className="h-11 rounded-xl"
                  />
                  <p className="text-sm text-muted-foreground">{tAiSetup("businessTypeHint")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="workspace-settings-industry-display">{tForm("industryLabel")}</Label>
                  <Input
                    id="workspace-settings-industry-display"
                    value={industryDisplay}
                    readOnly
                    tabIndex={-1}
                    className="h-11 rounded-xl bg-muted/40 text-foreground"
                    aria-readonly="true"
                  />
                  <p className="text-sm text-muted-foreground">{t("basicInfo.industryHint")}</p>
                </div>
              )}

              <div data-ai-setup-field="companyDescription">
                <CompanyDescriptionField
                  id="workspace-settings-company-description"
                  value={companyDescription}
                  onChange={setCompanyDescription}
                  disabled={isPending}
                  variant="create"
                />
              </div>

              <div className="space-y-4">
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

            <div className="space-y-6">
              <WorkspaceLogoField
                workspaceId={workspaceId}
                initialLogoUrl={initialLogoUrl}
                locale={locale}
                variant="settings"
              />
            </div>
          </div>

          {error ? (
            <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="mt-6">
            <Button type="submit" disabled={isPending}>
              {isPending ? t("saving") : t("save")}
            </Button>
          </div>
      </WorkspaceSettingsCard>
    </form>
  );
}
