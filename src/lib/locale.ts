export const locales = ["pl", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pl";

/** next-intl middleware reads this cookie for locale preference on `/`. */
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export const localeOptions: { value: Locale; flag: string; label: string }[] = [
  { value: "pl", flag: "🇵🇱", label: "Polski" },
  { value: "en", flag: "🇬🇧", label: "English" },
];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function setLocalePreferenceCookie(locale: Locale): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${LOCALE_COOKIE_NAME}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}
