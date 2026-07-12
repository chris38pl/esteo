import type { Locale } from "@/lib/locale";

import type {
  TrustDocLink,
  TrustPoint,
  TrustPromise,
  TrustTechnologyProvider,
} from "@/features/marketing/components/trust-center/trust-types";
import { legalOperatorCopy, serviceProviders } from "@/features/marketing/content/legal.config";
import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import { siteConfig } from "@/features/marketing/seo/site-config";

export type SecurityTrustPoint = TrustPoint;

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

export type SecurityDetailSection = {
  id: string;
  label: string;
  title: string;
  body: string;
};

export type SecurityProvidersPanel = {
  tabLabel: string;
  title: string;
  intro: string;
  disclaimer: string;
  providers: TrustTechnologyProvider[];
};

export type SecurityLearnMoreLink = {
  id: string;
  label: string;
  description: string;
  accent: TrustDocLink["accent"];
  path:
    | "/legal/privacy"
    | "/legal/cookies"
    | "/legal/ai"
    | "/legal/subprocessors"
    | "/legal/terms"
    | "/contact";
};

export type SecurityPageContent = SecurityBandContent & {
  pageTitle: string;
  pageDescription: string;
  pageSubtitle: string;
  promises: TrustPromise[];
  providersPanel: SecurityProvidersPanel;
  detailSections: SecurityDetailSection[];
  learnMoreLinks: SecurityLearnMoreLink[];
  docLinks: TrustDocLink[];
  footerNote: string;
};

const securityContentBase: Record<
  Locale,
  Omit<SecurityPageContent, "docLinks">
> = {
  pl: {
    eyebrow: "Bezpieczeństwo",
    titleBefore: "Twoje dane ",
    titleHighlight: "pod kontrolą",
    pageTitle: "Centrum bezpieczeństwa",
    pageDescription:
      "Wszystkie informacje dotyczące bezpieczeństwa, prywatności oraz zasad korzystania z Esteo w jednym miejscu.",
    pageSubtitle: "Esteo dba o Twoje dane, logowanie i płatności.",
    description:
      "Twoje wyceny, zapytania i ustawienia firmy należą do Twojego workspace. Ty zatwierdzasz każdą wycenę przed wysłaniem do klienta.",
    points: [
      {
        id: "workspace",
        title: "Dane należą do Twojej firmy",
        description:
          "Wyceny, zapytania i ustawienia są izolowane w obrębie Twojego workspace - tylko dla członków z uprawnieniami.",
      },
      {
        id: "auth",
        title: "Uwierzytelnianie",
        description:
          "Bezpieczne logowanie i zarządzanie sesją (m.in. przez Clerk). Esteo nie przechowuje haseł użytkowników.",
      },
      {
        id: "billing",
        title: "Płatności bez danych karty",
        description:
          "Subskrypcje i rozliczenia workspace obsługuje Stripe. Esteo nie przechowuje numerów kart płatniczych.",
      },
      {
        id: "ai",
        title: "AI pomaga, Ty decydujesz",
        description:
          "AI przygotowuje szkic kosztorysu. Ostateczna treść wyceny i odpowiedzialność za wysłanie pozostają po Twojej stronie.",
      },
      {
        id: "https",
        title: "Szyfrowane połączenie",
        description: legalOperatorCopy.pl.securityHttpsLine,
      },
      {
        id: "backups",
        title: "Kopie zapasowe",
        description: legalOperatorCopy.pl.securityBackupLine,
      },
    ],
    promises: [
      {
        id: "ownership",
        title: "Dane należą do Twojej firmy",
        description:
          "Masz pełną kontrolę nad swoimi danymi. To Ty decydujesz, co z nimi zrobisz.",
        iconSrc: "/images/marketing/security/trust-promises/ownership.png",
        accent: "blue",
      },
      {
        id: "approval",
        title: "Ty zatwierdzasz każdą wycenę",
        description:
          "AI przygotowuje szkic, ale ostateczna decyzja zawsze należy do Ciebie.",
        iconSrc: "/images/marketing/security/trust-promises/approval.png",
        accent: "blue",
      },
      {
        id: "no-sell",
        title: "Nie sprzedajemy danych",
        description:
          "Twoje dane nie są sprzedawane ani udostępniane reklamodawcom.",
        iconSrc: "/images/marketing/security/trust-promises/no-sell.png",
        accent: "teal",
      },
      {
        id: "ai-decision",
        title: "AI pomaga. Ty podejmujesz decyzję.",
        description:
          "AI przyspiesza proces, a Ty masz pełną kontrolę i odpowiedzialność.",
        iconSrc: "/images/marketing/security/trust-promises/ai-decision.png",
        accent: "purple",
      },
    ],
    providersPanel: {
      tabLabel: "Dostawcy infrastruktury",
      title: "Dostawcy infrastruktury",
      intro: "Korzystamy wyłącznie z zaufanych dostawców i sprawdzonych technologii.",
      disclaimer:
        "Nie sprzedajemy danych. Nie wykorzystujemy Twoich danych ani wycen do trenowania publicznych modeli AI.",
      providers: serviceProviders.pl.map((provider) => ({
        id: provider.id,
        name: provider.name,
        description: provider.description,
      })),
    },
    detailSections: [
      {
        id: "data",
        label: "Dane w aplikacji",
        title: "Dane w aplikacji",
        body: "Zapytania klientów, pozycje kosztorysów i ustawienia workspace są dostępne tylko dla członków workspace z odpowiednimi uprawnieniami. Nie publikujemy Twoich wycen publicznie.",
      },
      {
        id: "ai",
        label: "AI i przetwarzanie",
        title: "AI i przetwarzanie",
        body: "Funkcje AI generują szkice na podstawie przekazanych informacji. Użytkownik zawsze przegląda i zatwierdza treść przed wysłaniem do klienta. Szczegóły w sekcji AI i odpowiedzialność.",
      },
      {
        id: "incidents",
        label: "Zgłaszanie incydentów",
        title: "Zgłaszanie incydentów",
        body: `W razie problemów z bezpieczeństwem lub dostępem do danych napisz na ${siteConfig.supportEmail}. Traktujemy zgłoszenia priorytetowo w dni robocze.`,
      },
    ],
    learnMoreLinks: [
      {
        id: "privacy",
        label: "Polityka prywatności",
        description: "Dowiedz się, jak przetwarzamy i chronimy dane osobowe.",
        accent: "blue",
        path: "/legal/privacy",
      },
      {
        id: "subprocessors",
        label: "Dostawcy usług",
        description: "Z jakich zewnętrznych usług korzysta Esteo.",
        accent: "blue",
        path: "/legal/subprocessors",
      },
      {
        id: "cookies",
        label: "Cookies",
        description: "Informacje o plikach cookies i Twoich preferencjach.",
        accent: "teal",
        path: "/legal/cookies",
      },
      {
        id: "ai",
        label: "AI i odpowiedzialność",
        description: "Jak działa AI w Esteo i za co odpowiada użytkownik.",
        accent: "purple",
        path: "/legal/ai",
      },
      {
        id: "terms",
        label: "Regulamin",
        description: "Zasady korzystania z aplikacji Esteo i subskrypcji.",
        accent: "teal",
        path: "/legal/terms",
      },
      {
        id: "contact",
        label: "Kontakt",
        description: "Masz pytania dotyczące bezpieczeństwa lub danych?",
        accent: "purple",
        path: "/contact",
      },
    ],
    privacyLink: "Polityka prywatności",
    aiLink: "AI i odpowiedzialność",
    cta: "Dowiedz się więcej o bezpieczeństwie",
    footerNote:
      "Informacje na tej stronie mają charakter informacyjny i nie zastępują porady prawnej.",
  },
  en: {
    eyebrow: "Security",
    titleBefore: "Your data ",
    titleHighlight: "under your control",
    pageTitle: "Security Center",
    pageDescription:
      "All information about security, privacy, and the rules for using Esteo in one place.",
    pageSubtitle: "Esteo protects your data, sign-in, and payments.",
    description:
      "Your estimates, requests, and company settings belong to your workspace. You approve every estimate before sending it to a client.",
    points: [
      {
        id: "workspace",
        title: "Your company owns the data",
        description:
          "Estimates, requests, and settings are isolated within your workspace - only for members with the right permissions.",
      },
      {
        id: "auth",
        title: "Authentication",
        description:
          "Secure sign-in and session management (including via Clerk). Esteo does not store user passwords.",
      },
      {
        id: "billing",
        title: "Payments without card data",
        description:
          "Workspace subscriptions and billing are handled by Stripe. Esteo does not store payment card numbers.",
      },
      {
        id: "ai",
        title: "AI assists, you decide",
        description:
          "AI prepares an estimate draft. The final content and responsibility for sending it stay with you.",
      },
      {
        id: "https",
        title: "Encrypted connection",
        description: legalOperatorCopy.en.securityHttpsLine,
      },
      {
        id: "backups",
        title: "Backups",
        description: legalOperatorCopy.en.securityBackupLine,
      },
    ],
    promises: [
      {
        id: "ownership",
        title: "Your company owns the data",
        description:
          "You have full control over your data. You decide what happens to it.",
        iconSrc: "/images/marketing/security/trust-promises/ownership.png",
        accent: "blue",
      },
      {
        id: "approval",
        title: "You approve every estimate",
        description:
          "AI prepares a draft, but the final decision is always yours.",
        iconSrc: "/images/marketing/security/trust-promises/approval.png",
        accent: "blue",
      },
      {
        id: "no-sell",
        title: "We do not sell your data",
        description: "Your data is not sold or shared with advertisers.",
        iconSrc: "/images/marketing/security/trust-promises/no-sell.png",
        accent: "teal",
      },
      {
        id: "ai-decision",
        title: "AI assists. You make the decision.",
        description:
          "AI speeds up the process, and you retain full control and responsibility.",
        iconSrc: "/images/marketing/security/trust-promises/ai-decision.png",
        accent: "purple",
      },
    ],
    providersPanel: {
      tabLabel: "Infrastructure providers",
      title: "Infrastructure providers",
      intro: "We rely only on trusted providers and proven technologies.",
      disclaimer:
        "We do not sell data. We do not use your data or estimates to train public AI models.",
      providers: serviceProviders.en.map((provider) => ({
        id: provider.id,
        name: provider.name,
        description: provider.description,
      })),
    },
    detailSections: [
      {
        id: "data",
        label: "Data in the app",
        title: "Data in the app",
        body: "Customer requests, estimate line items, and workspace settings are available only to workspace members with the right permissions. We do not publish your estimates publicly.",
      },
      {
        id: "ai",
        label: "AI and processing",
        title: "AI and processing",
        body: "AI features generate drafts from the information you provide. You always review and approve content before sending it to a client. See AI & Responsibility for details.",
      },
      {
        id: "incidents",
        label: "Incident reporting",
        title: "Incident reporting",
        body: `If you notice a security or access issue, email ${siteConfig.supportEmail}. We treat reports as a priority on business days.`,
      },
    ],
    learnMoreLinks: [
      {
        id: "privacy",
        label: "Privacy Policy",
        description: "How we process and protect personal data.",
        accent: "blue",
        path: "/legal/privacy",
      },
      {
        id: "subprocessors",
        label: "Service providers",
        description: "Which external services Esteo uses.",
        accent: "blue",
        path: "/legal/subprocessors",
      },
      {
        id: "cookies",
        label: "Cookies",
        description: "Information about cookies and your preferences.",
        accent: "teal",
        path: "/legal/cookies",
      },
      {
        id: "ai",
        label: "AI & Responsibility",
        description: "How AI works in Esteo and what you are responsible for.",
        accent: "purple",
        path: "/legal/ai",
      },
      {
        id: "terms",
        label: "Terms of Service",
        description: "Rules for using the Esteo app and subscription.",
        accent: "teal",
        path: "/legal/terms",
      },
      {
        id: "contact",
        label: "Contact",
        description: "Questions about security or your data?",
        accent: "purple",
        path: "/contact",
      },
    ],
    privacyLink: "Privacy Policy",
    aiLink: "AI & Responsibility",
    cta: "Read about security",
    footerNote:
      "Information on this page is provided for transparency and does not replace legal advice.",
  },
};

function buildDocLinks(locale: Locale, links: SecurityLearnMoreLink[]): TrustDocLink[] {
  return links.map((link) => ({
    id: link.id,
    label: link.label,
    description: link.description,
    accent: link.accent,
    href: buildLocalizedPath(locale, link.path),
  }));
}

export function getSecurityBandContent(locale: Locale): SecurityBandContent {
  const {
    detailSections: _ds,
    providersPanel: _pp,
    pageSubtitle: _ps,
    promises: _p,
    learnMoreLinks: _lm,
    footerNote: _fn,
    pageTitle: _pt,
    pageDescription: _pd,
    ...band
  } = securityContentBase[locale];
  return band;
}

export function getSecurityPageContent(locale: Locale): SecurityPageContent {
  const base = securityContentBase[locale];
  return {
    ...base,
    docLinks: buildDocLinks(locale, base.learnMoreLinks),
  };
}
