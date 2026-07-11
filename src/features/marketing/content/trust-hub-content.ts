import { Cookie, FileText, Lock, Mail, Shield, Sparkles } from "lucide-react";

import type { TrustHubCardItem } from "@/features/marketing/components/trust-center/trust-types";
import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import type { Locale } from "@/lib/locale";

export type TrustHubPageContent = {
  pageTitle: string;
  pageDescription: string;
  cards: TrustHubCardItem[];
};

const hubCards: Record<Locale, Omit<TrustHubCardItem, "href">[]> = {
  pl: [
    {
      id: "security",
      title: "Bezpieczeństwo",
      description: "Jak chronimy Twoje dane, logowanie i płatności.",
      icon: Shield,
    },
    {
      id: "privacy",
      title: "Polityka prywatności",
      description: "Jak przetwarzamy i chronimy dane osobowe.",
      icon: Lock,
    },
    {
      id: "cookies",
      title: "Cookies",
      description: "Informacje o plikach cookies i Twoich preferencjach.",
      icon: Cookie,
    },
    {
      id: "ai",
      title: "AI i odpowiedzialność",
      description: "Jak działa AI w Esteo i za co odpowiada użytkownik.",
      icon: Sparkles,
    },
    {
      id: "terms",
      title: "Regulamin",
      description: "Zasady korzystania z aplikacji Esteo i subskrypcji.",
      icon: FileText,
    },
    {
      id: "contact",
      title: "Kontakt",
      description: "Masz pytania dotyczące bezpieczeństwa lub danych?",
      icon: Mail,
    },
  ],
  en: [
    {
      id: "security",
      title: "Security",
      description: "How we protect your data, sign-in, and payments.",
      icon: Shield,
    },
    {
      id: "privacy",
      title: "Privacy Policy",
      description: "How we process and protect personal data.",
      icon: Lock,
    },
    {
      id: "cookies",
      title: "Cookies",
      description: "Information about cookies and your preferences.",
      icon: Cookie,
    },
    {
      id: "ai",
      title: "AI & Responsibility",
      description: "How AI works in Esteo and what you are responsible for.",
      icon: Sparkles,
    },
    {
      id: "terms",
      title: "Terms of Service",
      description: "Rules for using the Esteo app and subscription.",
      icon: FileText,
    },
    {
      id: "contact",
      title: "Contact",
      description: "Questions about security or your data?",
      icon: Mail,
    },
  ],
};

const hubPaths: Record<string, string> = {
  security: "/security",
  privacy: "/legal/privacy",
  cookies: "/legal/cookies",
  ai: "/legal/ai",
  terms: "/legal/terms",
  contact: "/contact",
};

export function getTrustHubContent(locale: Locale): TrustHubPageContent {
  const cards = hubCards[locale].map((card) => ({
    ...card,
    href: buildLocalizedPath(locale, hubPaths[card.id] ?? "/legal"),
  }));

  return locale === "pl"
    ? {
        pageTitle: "Centrum bezpieczeństwa",
        pageDescription:
          "Wszystkie informacje dotyczące bezpieczeństwa, prywatności oraz zasad korzystania z Esteo w jednym miejscu.",
        cards,
      }
    : {
        pageTitle: "Security Center",
        pageDescription:
          "All information about security, privacy, and the rules for using Esteo in one place.",
        cards,
      };
}
