import type { Locale } from "@/lib/locale";

export type MarketingAuthCopy = {
  headerSignIn: string;
  goToApp: string;
  openApp: string;
};

const copyByLocale: Record<Locale, MarketingAuthCopy> = {
  pl: {
    headerSignIn: "Zaloguj się",
    goToApp: "Przejdź do aplikacji",
    openApp: "Otwórz aplikację",
  },
  en: {
    headerSignIn: "Sign in",
    goToApp: "Go to app",
    openApp: "Open app",
  },
};

export function marketingAppHref(locale: Locale): string {
  return `/${locale}/dashboard`;
}

export function getMarketingAuthCopy(locale: Locale): MarketingAuthCopy {
  return copyByLocale[locale];
}

export function resolveMarketingPrimaryCta(
  locale: Locale,
  isSignedIn: boolean,
  signedOut: { href: string; label: string },
  signedInLabel?: keyof MarketingAuthCopy | string,
): { href: string; label: string } {
  if (!isSignedIn) {
    return signedOut;
  }

  const copy = getMarketingAuthCopy(locale);
  const label =
    signedInLabel === "openApp" || signedInLabel === "goToApp"
      ? copy[signedInLabel]
      : typeof signedInLabel === "string"
        ? signedInLabel
        : copy.goToApp;

  return {
    href: marketingAppHref(locale),
    label,
  };
}
