"use client";

import { Hash, Mail, MapPin, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { appToast } from "@/components/ui/app-toast";
import { CompanyProfileFieldLabel } from "@/features/workspaces/components/company-profile-field-label";
import {
  COMPANY_ADDRESS_MAX_LENGTH,
  updateWorkspaceCompanyProfileSchema,
} from "@/features/workspaces/schemas/company-profile";
import { updateWorkspaceCompanyProfileAction } from "@/features/workspaces/server/actions";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { WorkspaceSettingsCard } from "@/features/workspaces/components/workspace-settings-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const textareaClassName = cn(
  "min-h-[100px] w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm dark:bg-input/30",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

function mapValidationError(
  message: string | undefined,
  tErrors: ReturnType<typeof useTranslations<"workspaces.settings.company.errors">>,
): string {
  switch (message) {
    case "INVALID_TAX_ID":
      return tErrors("invalidTaxId");
    case "INVALID_EMAIL":
      return tErrors("invalidEmail");
    case "INVALID_PHONE":
      return tErrors("invalidPhone");
    default:
      return tErrors("generic");
  }
}

export function WorkspaceSettingsCompanyTab({
  workspaceId,
  initialCompanyAddress,
  initialCompanyTaxId,
  initialCompanyEmail,
  initialCompanyPhone,
  locale,
}: {
  workspaceId: string;
  initialCompanyAddress: string;
  initialCompanyTaxId: string;
  initialCompanyEmail: string;
  initialCompanyPhone: string;
  locale: Locale;
}) {
  const t = useTranslations("workspaces.settings.company");
  const tTabs = useTranslations("workspaces.settings.tabs");
  const tErrors = useTranslations("workspaces.settings.company.errors");
  const tSettings = useTranslations("workspaces.settings");
  const router = useRouter();

  const [companyAddress, setCompanyAddress] = useState(initialCompanyAddress);
  const [companyTaxId, setCompanyTaxId] = useState(initialCompanyTaxId);
  const [companyEmail, setCompanyEmail] = useState(initialCompanyEmail);
  const [companyPhone, setCompanyPhone] = useState(initialCompanyPhone);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = updateWorkspaceCompanyProfileSchema.safeParse({
      companyAddress: companyAddress.trim() || null,
      companyTaxId: companyTaxId.trim() || null,
      companyEmail: companyEmail.trim() || null,
      companyPhone: companyPhone.trim() || null,
    });

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(mapValidationError(issue?.message, tErrors));
      return;
    }

    startTransition(async () => {
      const result = await updateWorkspaceCompanyProfileAction(
        workspaceId,
        parsed.data,
        locale,
      );

      if (!result.success) {
        setError(result.error);
        appToast.error(result.error);
        return;
      }

      appToast.success(t("saveSuccessToast"));
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <WorkspaceSettingsCard title={tTabs("company")}>
          <div className="space-y-2">
            <CompanyProfileFieldLabel htmlFor="workspace-company-address" icon={MapPin}>
              {t("addressLabel")}
            </CompanyProfileFieldLabel>
            <textarea
              id="workspace-company-address"
              value={companyAddress}
              onChange={(event) => setCompanyAddress(event.target.value)}
              placeholder={t("addressPlaceholder")}
              disabled={isPending}
              maxLength={COMPANY_ADDRESS_MAX_LENGTH}
              className={textareaClassName}
            />
          </div>

          <div className="space-y-2">
            <CompanyProfileFieldLabel htmlFor="workspace-company-tax-id" icon={Hash}>
              {t("taxIdLabel")}
            </CompanyProfileFieldLabel>
            <Input
              id="workspace-company-tax-id"
              value={companyTaxId}
              onChange={(event) => setCompanyTaxId(event.target.value)}
              placeholder={t("taxIdPlaceholder")}
              disabled={isPending}
              className="h-11 rounded-xl"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <CompanyProfileFieldLabel htmlFor="workspace-company-email" icon={Mail}>
              {t("emailLabel")}
            </CompanyProfileFieldLabel>
            <Input
              id="workspace-company-email"
              type="email"
              value={companyEmail}
              onChange={(event) => setCompanyEmail(event.target.value)}
              placeholder={t("emailPlaceholder")}
              disabled={isPending}
              className="h-11 rounded-xl"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <CompanyProfileFieldLabel htmlFor="workspace-company-phone" icon={Phone}>
              {t("phoneLabel")}
            </CompanyProfileFieldLabel>
            <Input
              id="workspace-company-phone"
              type="tel"
              value={companyPhone}
              onChange={(event) => setCompanyPhone(event.target.value)}
              placeholder={t("phonePlaceholder")}
              disabled={isPending}
              className="h-11 rounded-xl"
              autoComplete="tel"
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full rounded-lg sm:w-auto" disabled={isPending}>
            {isPending ? tSettings("saving") : tSettings("save")}
          </Button>
      </WorkspaceSettingsCard>
    </form>
  );
}
