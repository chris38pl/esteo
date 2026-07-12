"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import type { Locale } from "@/lib/locale";

const checkboxId = "sign-up-terms-acceptance";
const errorId = "sign-up-terms-acceptance-error";

export function SignUpTermsAcceptance({
  locale,
  accepted,
  onAcceptedChange,
  showError = false,
}: {
  locale: Locale;
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  showError?: boolean;
}) {
  const t = useTranslations("auth.signUp.termsAccept");

  return (
    <div className="space-y-1">
      <div className="flex items-start gap-3">
        <Checkbox
          id={checkboxId}
          checked={accepted}
          onCheckedChange={(checked) => onAcceptedChange(checked === true)}
          aria-invalid={showError}
          aria-describedby={showError ? errorId : undefined}
          className="mt-0.5"
        />
        <Label
          htmlFor={checkboxId}
          className="cursor-pointer text-xs leading-5 font-normal text-muted-foreground"
        >
          {t("prefix")}{" "}
          <Link
            href={buildLocalizedPath(locale, "/legal/terms")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            {t("termsLink")}
          </Link>{" "}
          {t("and")}{" "}
          <Link
            href={buildLocalizedPath(locale, "/legal/privacy")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            {t("privacyLink")}
          </Link>
          .
        </Label>
      </div>
      {showError ? (
        <p id={errorId} className="text-xs text-destructive">
          {t("required")}
        </p>
      ) : null}
    </div>
  );
}
