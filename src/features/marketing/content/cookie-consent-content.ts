import type { Locale } from "@/lib/locale";

export type CookieConsentContent = {
  bannerTitle: string;
  bannerDescription: string;
  bannerDescriptionShort: string;
  trustLine: string;
  learnMoreLink: string;
  customizeTitle: string;
  customizeSubtitle: string;
  ctaAcceptAll: string;
  ctaAcceptShort: string;
  ctaCustomize: string;
  ctaReject: string;
  ctaSave: string;
  toastSaved: string;
  statusHeading: string;
  statusAnalyticsOn: string;
  statusAnalyticsOff: string;
  statusNoChoice: string;
  footerPreferences: string;
  changeSettings: string;
  categoryNecessaryTitle: string;
  categoryNecessarySubtitle: string;
  categoryAnalyticsTitle: string;
  categoryAnalyticsSubtitle: string;
  analyticsSwitchLabel: string;
};

export const cookieConsentContent: Record<Locale, CookieConsentContent> = {
  pl: {
    bannerTitle: "Cookies w Esteo",
    bannerDescription:
      "Używamy niezbędnych cookies do działania aplikacji. Za Twoją zgodą wykorzystujemy również analitykę.",
    bannerDescriptionShort: "Używamy cookies. Za Twoją zgodą także analitykę.",
    trustLine: "Nie wykorzystujemy Twoich wycen do trenowania publicznych modeli AI.",
    learnMoreLink: "Dowiedz się więcej o cookies →",
    customizeTitle: "Preferencje cookies",
    customizeSubtitle: "Możesz zmienić ustawienia w każdej chwili.",
    ctaAcceptAll: "Akceptuję wszystkie",
    ctaAcceptShort: "Akceptuję",
    ctaCustomize: "Dostosuj",
    ctaReject: "Odrzuć",
    ctaSave: "Zapisz wybór",
    toastSaved: "Preferencje zostały zapisane.",
    statusHeading: "Ostatni wybór użytkownika",
    statusAnalyticsOn: "Analityczne: Włączone",
    statusAnalyticsOff: "Analityczne: Wyłączone",
    statusNoChoice: "Brak zapisanego wyboru",
    footerPreferences: "Preferencje cookies",
    changeSettings: "zmień ustawienia",
    categoryNecessaryTitle: "Niezbędne",
    categoryNecessarySubtitle: "Zawsze aktywne",
    categoryAnalyticsTitle: "Analityczne",
    categoryAnalyticsSubtitle: "Pomagają nam ulepszać stronę",
    analyticsSwitchLabel: "Włącz cookies analityczne",
  },
  en: {
    bannerTitle: "Cookies in Esteo",
    bannerDescription:
      "We use essential cookies to run the application. With your consent, we also use analytics.",
    bannerDescriptionShort: "We use cookies. With your consent, analytics too.",
    trustLine: "We do not use your estimates to train public AI models.",
    learnMoreLink: "Learn more about cookies →",
    customizeTitle: "Cookie preferences",
    customizeSubtitle: "You can change your settings at any time.",
    ctaAcceptAll: "Accept all",
    ctaAcceptShort: "Accept",
    ctaCustomize: "Customize",
    ctaReject: "Reject",
    ctaSave: "Save choices",
    toastSaved: "Your preferences have been saved.",
    statusHeading: "Your last choice",
    statusAnalyticsOn: "Analytics: Enabled",
    statusAnalyticsOff: "Analytics: Disabled",
    statusNoChoice: "No saved choice yet",
    footerPreferences: "Cookie preferences",
    changeSettings: "change settings",
    categoryNecessaryTitle: "Essential",
    categoryNecessarySubtitle: "Always active",
    categoryAnalyticsTitle: "Analytics",
    categoryAnalyticsSubtitle: "Help us improve the site",
    analyticsSwitchLabel: "Enable analytics cookies",
  },
};

export function getCookieConsentContent(locale: Locale): CookieConsentContent {
  return cookieConsentContent[locale];
}
