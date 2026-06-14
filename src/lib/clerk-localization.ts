import { enUS, plPL } from "@clerk/localizations";
import type { LocalizationResource } from "@clerk/types";

import type { Locale } from "@/lib/locale";

/** Gaps in community pl-PL translations for auth flows. */
const PL_ERROR_OVERRIDES = {
  form_code_incorrect: "Nieprawidłowy kod. Spróbuj ponownie.",
  form_param_format_invalid__identifier:
    "Podany identyfikator jest nieprawidłowy. Wprowadź poprawny adres e-mail.",
} as const satisfies Partial<
  NonNullable<LocalizationResource["unstable__errors"]>
>;

function mergeLocalization(
  base: LocalizationResource,
  errorOverrides?: Partial<NonNullable<LocalizationResource["unstable__errors"]>>,
): LocalizationResource {
  if (!errorOverrides) {
    return base;
  }

  return {
    ...base,
    unstable__errors: {
      ...base.unstable__errors,
      ...errorOverrides,
    },
  };
}

const CLERK_LOCALES: Record<Locale, LocalizationResource> = {
  pl: mergeLocalization(plPL, PL_ERROR_OVERRIDES),
  en: enUS,
};

export function getClerkLocalization(locale: Locale): LocalizationResource {
  return CLERK_LOCALES[locale];
}
