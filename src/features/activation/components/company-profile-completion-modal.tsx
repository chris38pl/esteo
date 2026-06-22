"use client";

import {
  ImageIcon,
  Mail,
  MapPin,
  Phone,
  Hash,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { CompanyProfileFieldLabel } from "@/features/workspaces/components/company-profile-field-label";
import {
  ActivationAnalyticsEvents,
  trackActivationEvent,
} from "@/features/activation/lib/activation-analytics";
import {
  getMissingWorkspaceCompanyProfileFields,
  isWorkspaceCompanyProfileComplete,
  type WorkspaceCompanyProfileClient,
  type WorkspaceCompanyProfileField,
} from "@/features/workspaces/lib/company-profile-for-export";
import { updateWorkspaceCompanyProfileSchema } from "@/features/workspaces/schemas/company-profile";
import { updateWorkspaceCompanyProfileAction } from "@/features/workspaces/server/actions";
import { WorkspaceLogoField } from "@/features/workspaces/components/workspace-logo-field";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const textareaClassName = cn(
  "min-h-[88px] w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm dark:bg-input/30",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

interface CompanyProfileCompletionModalProps {
  open: boolean;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  initialProfile: WorkspaceCompanyProfileClient;
  initialLogoUrl: string | null;
  missingFields: WorkspaceCompanyProfileField[];
  onOpenChange: (open: boolean) => void;
  onProceed: () => void;
  onProfileUpdated: (profile: WorkspaceCompanyProfileClient) => void;
}

export function CompanyProfileCompletionModal({
  open,
  workspaceId,
  workspaceSlug,
  locale,
  initialProfile,
  initialLogoUrl,
  missingFields,
  onOpenChange,
  onProceed,
  onProfileUpdated,
}: CompanyProfileCompletionModalProps) {
  const t = useTranslations("activation.companyProfileModal");
  const tCompany = useTranslations("workspaces.settings.company");
  const tErrors = useTranslations("workspaces.settings.company.errors");
  const router = useRouter();
  const [companyAddress, setCompanyAddress] = useState(initialProfile.address ?? "");
  const [companyTaxId, setCompanyTaxId] = useState(initialProfile.taxId ?? "");
  const [companyEmail, setCompanyEmail] = useState(initialProfile.email ?? "");
  const [companyPhone, setCompanyPhone] = useState(initialProfile.phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function mapValidationError(message: string | undefined): string {
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

  function handleSkip() {
    onProceed();
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
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
      setError(mapValidationError(issue?.message));
      return;
    }

    startTransition(async () => {
      const wasComplete = isWorkspaceCompanyProfileComplete({
        address: initialProfile.address,
        taxId: initialProfile.taxId,
        email: initialProfile.email,
        phone: initialProfile.phone,
        logoStorageKey: initialProfile.logoStorageKey,
      });

      const result = await updateWorkspaceCompanyProfileAction(
        workspaceId,
        parsed.data,
        locale,
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      const nextProfile: WorkspaceCompanyProfileClient = {
        address: parsed.data.companyAddress,
        taxId: parsed.data.companyTaxId,
        email: parsed.data.companyEmail,
        phone: parsed.data.companyPhone,
        logoStorageKey: initialProfile.logoStorageKey,
      };

      onProfileUpdated(nextProfile);
      router.refresh();

      const isComplete = isWorkspaceCompanyProfileComplete(nextProfile);
      if (!wasComplete && isComplete) {
        trackActivationEvent(ActivationAnalyticsEvents.companyProfileCompleted, {
          workspaceSlug,
        });
      }

      onProceed();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="space-y-3 pb-3">
          <DialogTitle className="mb-1">{t("title")}</DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">{t("description")}</span>
            <span className="block text-muted-foreground">{t("deferHint")}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5">
          {missingFields.length > 0 ? (
            <div className="space-y-2.5 pb-3">
              <p className="text-sm font-medium text-foreground">{t("missingFieldsLabel")}</p>
              <div className="flex flex-wrap gap-2">
                {missingFields.map((field) => (
                  <Badge key={field} variant="secondary" className="px-2.5 py-1">
                    {t(`fields.${field}`)}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          <WorkspaceLogoField
            workspaceId={workspaceId}
            initialLogoUrl={initialLogoUrl}
            locale={locale}
            label={
              <CompanyProfileFieldLabel icon={ImageIcon}>
                {t("fields.logo")}
              </CompanyProfileFieldLabel>
            }
          />

          <div className="space-y-2">
            <CompanyProfileFieldLabel htmlFor="activation-company-address" icon={MapPin}>
              {t("fields.address")}
            </CompanyProfileFieldLabel>
            <textarea
              id="activation-company-address"
              value={companyAddress}
              onChange={(event) => setCompanyAddress(event.target.value)}
              placeholder={tCompany("addressPlaceholder")}
              disabled={isPending}
              className={textareaClassName}
            />
          </div>

          <div className="space-y-2">
            <CompanyProfileFieldLabel htmlFor="activation-company-tax-id" icon={Hash}>
              {t("fields.taxId")}
            </CompanyProfileFieldLabel>
            <Input
              id="activation-company-tax-id"
              value={companyTaxId}
              onChange={(event) => setCompanyTaxId(event.target.value)}
              placeholder={tCompany("taxIdPlaceholder")}
              disabled={isPending}
              className="h-11 rounded-xl"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <CompanyProfileFieldLabel htmlFor="activation-company-email" icon={Mail}>
              {t("fields.email")}
            </CompanyProfileFieldLabel>
            <Input
              id="activation-company-email"
              type="email"
              value={companyEmail}
              onChange={(event) => setCompanyEmail(event.target.value)}
              placeholder={tCompany("emailPlaceholder")}
              disabled={isPending}
              className="h-11 rounded-xl"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <CompanyProfileFieldLabel htmlFor="activation-company-phone" icon={Phone}>
              {t("fields.phone")}
            </CompanyProfileFieldLabel>
            <Input
              id="activation-company-phone"
              type="tel"
              value={companyPhone}
              onChange={(event) => setCompanyPhone(event.target.value)}
              placeholder={tCompany("phonePlaceholder")}
              disabled={isPending}
              className="h-11 rounded-xl"
              autoComplete="tel"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter className="gap-2 sm:flex-col sm:items-stretch">
            <Button type="submit" disabled={isPending}>
              {t("saveAndContinue")}
            </Button>
            <Button type="button" variant="outline" onClick={handleSkip} disabled={isPending}>
              {t("skipForNow")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
