"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      <DialogContent showCloseButton className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">{t("description")}</span>
            <span className="block text-muted-foreground">{t("deferHint")}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          {missingFields.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t("missingFieldsLabel")}</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {missingFields.map((field) => (
                  <li key={field}>{t(`fields.${field}`)}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <WorkspaceLogoField
            workspaceId={workspaceId}
            initialLogoUrl={initialLogoUrl}
            locale={locale}
          />

          <div className="space-y-2">
            <Label htmlFor="activation-company-address">{t("fields.address")}</Label>
            <textarea
              id="activation-company-address"
              value={companyAddress}
              onChange={(event) => setCompanyAddress(event.target.value)}
              disabled={isPending}
              className={textareaClassName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activation-company-tax-id">{t("fields.taxId")}</Label>
            <Input
              id="activation-company-tax-id"
              value={companyTaxId}
              onChange={(event) => setCompanyTaxId(event.target.value)}
              disabled={isPending}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activation-company-email">{t("fields.email")}</Label>
            <Input
              id="activation-company-email"
              type="email"
              value={companyEmail}
              onChange={(event) => setCompanyEmail(event.target.value)}
              disabled={isPending}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activation-company-phone">{t("fields.phone")}</Label>
            <Input
              id="activation-company-phone"
              type="tel"
              value={companyPhone}
              onChange={(event) => setCompanyPhone(event.target.value)}
              disabled={isPending}
              className="h-11 rounded-xl"
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
