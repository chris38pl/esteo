import type { Locale } from "@/lib/locale";

export type SecurityTrustPoint = {
  id: string;
  title: string;
  description: string;
};

export type SecurityBandContent = {
  eyebrow: string;
  titleBefore: string;
  titleHighlight: string;
  description: string;
  points: SecurityTrustPoint[];
  privacyLink: string;
  aiLink: string;
  cta: string;
};

export type SecurityPageContent = SecurityBandContent & {
  pageTitle: string;
  pageDescription: string;
  sections: Array<{ title: string; body: string }>;
};

const securityContent: Record<Locale, SecurityPageContent> = {
  pl: {
    eyebrow: "Bezpieczeństwo",
    titleBefore: "Twoje dane ",
    titleHighlight: "pod kontrolą",
    pageTitle: "Bezpieczeństwo i dane",
    pageDescription:
      "Jak Esteo chroni dane workspace, logowanie i płatności. Bez przesadzonych obietnic - konkretne informacje o dostawcach i odpowiedzialności.",
    description:
      "Logowanie przez Clerk, płatności przez Stripe, dane w Twoim workspace. Polityka prywatności i zasady AI są publicznie dostępne.",
    points: [
      {
        id: "auth",
        title: "Uwierzytelnianie przez Clerk",
        description: "Bezpieczne logowanie i zarządzanie sesją bez budowania własnego systemu haseł.",
      },
      {
        id: "billing",
        title: "Płatności przez Stripe",
        description: "Subskrypcje i rozliczenia workspace obsługuje Stripe - bez przechowywania danych karty.",
      },
      {
        id: "workspace",
        title: "Dane w workspace",
        description: "Wyceny, zapytania i ustawienia firmy są izolowane w obrębie Twojego workspace.",
      },
      {
        id: "ai",
        title: "AI udokumentowane",
        description: "AI tworzy szkice do Twojej weryfikacji. Zasady odpowiedzialności opisuje strona AI Disclaimer.",
      },
    ],
    privacyLink: "Polityka prywatności",
    aiLink: "AI Disclaimer",
    cta: "Dowiedz się więcej o bezpieczeństwie",
    sections: [
      {
        title: "Dostawcy infrastruktury",
        body: "Esteo korzysta ze sprawdzonych dostawców: Clerk (uwierzytelnianie), Stripe (płatności i subskrypcje) oraz infrastruktury chmurowej do hostingu aplikacji i bazy danych. Nie sprzedajemy danych klientów.",
      },
      {
        title: "Dane w aplikacji",
        body: "Zapytania klientów, pozycje kosztorysów i ustawienia workspace są dostępne tylko dla członków workspace z odpowiednimi uprawnieniami. Nie publikujemy Twoich wycen publicznie.",
      },
      {
        title: "AI i odpowiedzialność",
        body: "Funkcje AI generują szkice na podstawie przekazanych informacji. Użytkownik zawsze przegląda i zatwierdza treść przed wysłaniem do klienta. Szczegóły w AI Disclaimer.",
      },
      {
        title: "Zgłaszanie incydentów",
        body: "W razie problemów z bezpieczeństwem lub dostępem do danych napisz na support@esteo.app. Traktujemy zgłoszenia priorytetowo w dni robocze.",
      },
    ],
  },
  en: {
    eyebrow: "Security",
    titleBefore: "Your data ",
    titleHighlight: "under your control",
    pageTitle: "Security and data",
    pageDescription:
      "How Esteo handles workspace data, authentication, and billing. Clear information about providers and responsibility - no exaggerated claims.",
    description:
      "Authentication through Clerk, billing through Stripe, data in your workspace. Privacy and AI policies are publicly available.",
    points: [
      {
        id: "auth",
        title: "Authentication through Clerk",
        description: "Secure sign-in and session management without building a custom password system.",
      },
      {
        id: "billing",
        title: "Billing through Stripe",
        description: "Workspace subscriptions and billing are handled by Stripe - card data is not stored in Esteo.",
      },
      {
        id: "workspace",
        title: "Data in your workspace",
        description: "Estimates, requests, and company settings are isolated within your workspace.",
      },
      {
        id: "ai",
        title: "AI documented",
        description: "AI creates drafts for your review. Responsibility rules are described on the AI Disclaimer page.",
      },
    ],
    privacyLink: "Privacy Policy",
    aiLink: "AI Disclaimer",
    cta: "Read about security",
    sections: [
      {
        title: "Infrastructure providers",
        body: "Esteo uses established providers: Clerk (authentication), Stripe (payments and subscriptions), and cloud infrastructure for hosting and databases. We do not sell customer data.",
      },
      {
        title: "Data in the app",
        body: "Customer requests, estimate line items, and workspace settings are available only to workspace members with the right permissions. We do not publish your estimates publicly.",
      },
      {
        title: "AI and responsibility",
        body: "AI features generate drafts from the information you provide. You always review and approve content before sending it to a client. See the AI Disclaimer for details.",
      },
      {
        title: "Reporting incidents",
        body: "If you notice a security or access issue, email support@esteo.app. We treat reports as a priority on business days.",
      },
    ],
  },
};

export function getSecurityBandContent(locale: Locale): SecurityBandContent {
  const { sections: _sections, pageTitle: _pageTitle, pageDescription: _pageDescription, ...band } =
    securityContent[locale];
  return band;
}

export function getSecurityPageContent(locale: Locale): SecurityPageContent {
  return securityContent[locale];
}
