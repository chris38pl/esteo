"use client";

import * as Clerk from "@clerk/elements/common";
import { useLocale, useTranslations } from "next-intl";

import { getLocalizedClerkFieldError } from "@/lib/clerk-api-error";
import { isLocale, type Locale } from "@/lib/locale";

export function LocalizedClerkFieldError({ className }: { className?: string }) {
  const localeParam = useLocale();
  const locale: Locale = isLocale(localeParam) ? localeParam : "pl";
  const t = useTranslations("auth");

  return (
    <Clerk.FieldError className={className}>
      {(error) => (
        <span role="alert">
          {getLocalizedClerkFieldError(
            { code: String(error.code), message: error.message },
            locale,
            t("errors.generic"),
          )}
        </span>
      )}
    </Clerk.FieldError>
  );
}

export function LocalizedClerkGlobalError({ className }: { className?: string }) {
  const localeParam = useLocale();
  const locale: Locale = isLocale(localeParam) ? localeParam : "pl";
  const t = useTranslations("auth");

  return (
    <Clerk.GlobalError className={className}>
      {(error) => (
        <div role="alert">
          {getLocalizedClerkFieldError(
            { code: String(error.code), message: error.message },
            locale,
            t("errors.generic"),
          )}
        </div>
      )}
    </Clerk.GlobalError>
  );
}
