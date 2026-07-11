import type { Locale } from "@/lib/locale";

export type TrustSharedContent = {
  securityCenterLabel: string;
  learnMoreHeading: string;
  supportHeading: string;
  supportEmail: string;
  supportLink: string;
  lastUpdatedLabel: string;
  versionLabel: string;
  promisesSectionTitleBefore: string;
  promisesSectionTitleHighlight: string;
  promisesSectionSubtitle: string;
  technicalDetailsTitle: string;
  footerNote: string;
  hubCtaLabel: string;
};

export const trustSharedContent: Record<Locale, TrustSharedContent> = {
  pl: {
    securityCenterLabel: "Centrum bezpieczeństwa",
    learnMoreHeading: "Dowiedz się więcej",
    supportHeading: "Czy nie znalazłeś odpowiedzi?",
    supportEmail: "support@esteo.app",
    supportLink: "Skontaktuj się z nami",
    lastUpdatedLabel: "Ostatnia aktualizacja",
    versionLabel: "Wersja",
    promisesSectionTitleBefore: "Dlaczego możesz nam ",
    promisesSectionTitleHighlight: "zaufać?",
    promisesSectionSubtitle:
      "Twoje dane, decyzje i bezpieczeństwo są u nas na pierwszym miejscu.",
    technicalDetailsTitle: "Szczegóły techniczne",
    footerNote:
      "Informacje na tej stronie mają charakter informacyjny i nie zastępują porady prawnej.",
    hubCtaLabel: "Przejdź",
  },
  en: {
    securityCenterLabel: "Security Center",
    learnMoreHeading: "Learn more",
    supportHeading: "Didn't find what you were looking for?",
    supportEmail: "support@esteo.app",
    supportLink: "Contact us",
    lastUpdatedLabel: "Last updated",
    versionLabel: "Version",
    promisesSectionTitleBefore: "Why you can ",
    promisesSectionTitleHighlight: "trust us",
    promisesSectionSubtitle:
      "Your data, decisions, and security come first with us.",
    technicalDetailsTitle: "Technical details",
    footerNote:
      "Information on this page is provided for transparency and does not replace legal advice.",
    hubCtaLabel: "Go to",
  },
};

export function getTrustSharedContent(locale: Locale): TrustSharedContent {
  return trustSharedContent[locale];
}
