import type { Locale } from "@/lib/locale";

import type {
  TrustDocLink,
  TrustPoint,
  TrustPromise,
  TrustTechnologyProvider,
} from "@/features/marketing/components/trust-center/trust-types";
import { buildLocalizedPath } from "@/features/marketing/lib/build-url";

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
  path: "/legal/privacy" | "/legal/cookies" | "/legal/ai";
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
    pageTitle: "Bezpieczeństwo",
    pageDescription: "Esteo dba o Twoje dane, logowanie i płatności.",
    pageSubtitle: "Poniżej znajdziesz najważniejsze informacje.",
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
        title: "Bezpieczne logowanie",
        description:
          "Uwierzytelnianie obsługuje Clerk - nie budujemy własnego systemu haseł ani nie przechowujemy haseł w Esteo.",
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
      providers: [
        {
          id: "clerk",
          name: "Clerk",
          description: "Uwierzytelnianie i zarządzanie sesjami użytkowników.",
        },
        {
          id: "stripe",
          name: "Stripe",
          description: "Płatności i zarządzanie subskrypcjami.",
        },
        {
          id: "vercel",
          name: "Vercel",
          description: "Hosting aplikacji i infrastruktura.",
        },
        {
          id: "neon",
          name: "Neon",
          description: "Baza danych PostgreSQL w chmurze.",
        },
        {
          id: "uploadthing",
          name: "UploadThing",
          description: "Bezpieczne przechowywanie plików.",
        },
        {
          id: "openai",
          name: "OpenAI",
          description: "Modele AI wspierające tworzenie szkiców.",
        },
      ],
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
        body: "W razie problemów z bezpieczeństwem lub dostępem do danych napisz na support@esteo.app. Traktujemy zgłoszenia priorytetowo w dni robocze.",
      },
    ],
    learnMoreLinks: [
      {
        id: "privacy",
        label: "Polityka prywatności",
        description: "Dowiedz się, jak chronimy Twoje dane osobowe.",
        accent: "blue",
        path: "/legal/privacy",
      },
      {
        id: "cookies",
        label: "Cookies",
        description: "Sprawdź, jakich cookies używamy i jak możesz nimi zarządzać.",
        accent: "teal",
        path: "/legal/cookies",
      },
      {
        id: "ai",
        label: "AI i odpowiedzialność",
        description: "Poznaj zasady działania AI w Esteo i Twoją odpowiedzialność.",
        accent: "purple",
        path: "/legal/ai",
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
    pageTitle: "Security",
    pageDescription: "Esteo protects your data, sign-in, and payments.",
    pageSubtitle: "Below you'll find the most important information.",
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
        title: "Secure sign-in",
        description:
          "Authentication is handled by Clerk - we do not build a custom password system or store passwords in Esteo.",
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
      providers: [
        {
          id: "clerk",
          name: "Clerk",
          description: "Authentication and user session management.",
        },
        {
          id: "stripe",
          name: "Stripe",
          description: "Payments and subscription management.",
        },
        {
          id: "vercel",
          name: "Vercel",
          description: "App hosting and infrastructure.",
        },
        {
          id: "neon",
          name: "Neon",
          description: "Cloud PostgreSQL database.",
        },
        {
          id: "uploadthing",
          name: "UploadThing",
          description: "Secure file storage.",
        },
        {
          id: "openai",
          name: "OpenAI",
          description: "AI models supporting draft generation.",
        },
      ],
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
        body: "If you notice a security or access issue, email support@esteo.app. We treat reports as a priority on business days.",
      },
    ],
    learnMoreLinks: [
      {
        id: "privacy",
        label: "Privacy Policy",
        description: "Learn how we protect your personal data.",
        accent: "blue",
        path: "/legal/privacy",
      },
      {
        id: "cookies",
        label: "Cookies",
        description: "See which cookies we use and how you can manage them.",
        accent: "teal",
        path: "/legal/cookies",
      },
      {
        id: "ai",
        label: "AI & Responsibility",
        description: "Understand how AI works in Esteo and your responsibilities.",
        accent: "purple",
        path: "/legal/ai",
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
