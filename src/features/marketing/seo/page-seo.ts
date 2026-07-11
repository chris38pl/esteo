import type { Locale } from "@/lib/locale";

import type { MarketingRouteId } from "@/features/marketing/seo/site-config";
import { siteConfig } from "@/features/marketing/seo/site-config";

export type MarketingPageSeo = {
  title: string;
  description: string;
  ogImage?: string;
};

export const marketingPageSeo: Record<MarketingRouteId, Record<Locale, MarketingPageSeo>> = {
  home: {
    pl: {
      title: "Program do wycen i kosztorysów z AI",
      description:
        "Esteo - AI-assisted workspace dla firm usługowych. Od zapytania klienta do profesjonalnego PDF w kilka minut. Szkic AI, pełna kontrola, eksport PDF.",
      ogImage: "/images/marketing/og/landing-og.png",
    },
    en: {
      title: "AI-assisted estimating software",
      description:
        "Esteo - AI-assisted workspace for service companies. From customer request to professional PDF in minutes. AI draft, full control, PDF export.",
      ogImage: "/images/marketing/og/landing-og.png",
    },
  },
  pricing: {
    pl: {
      title: "Cennik",
      description:
        "Plany FREE, PRO i BUSINESS dla firm usługowych. Porównaj limity, współpracę zespołu i funkcje kosztorysów z AI.",
    },
    en: {
      title: "Pricing",
      description:
        "FREE, PRO, and BUSINESS plans for service companies. Compare limits, team collaboration, and AI estimate features.",
    },
  },
  faq: {
    pl: {
      title: "FAQ",
      description:
        "Odpowiedzi o AI, edycji wycen, PDF, danych, planach darmowych i anulowaniu subskrypcji w Esteo.",
    },
    en: {
      title: "FAQ",
      description:
        "Answers about AI, editing estimates, PDF export, data, free plans, and subscription cancellation in Esteo.",
    },
  },
  contact: {
    pl: {
      title: "Kontakt",
      description: "Skontaktuj się z zespołem Esteo - support@esteo.app.",
    },
    en: {
      title: "Contact",
      description: "Contact the Esteo team - support@esteo.app.",
    },
  },
  security: {
    pl: {
      title: "Bezpieczeństwo",
      description:
        "Jak Esteo chroni Twoje dane, logowanie i płatności. Konkretnie i transparentnie.",
    },
    en: {
      title: "Security",
      description:
        "How Esteo protects your data, sign-in, and payments. Clear and transparent.",
    },
  },
  legal: {
    pl: {
      title: "Centrum bezpieczeństwa",
      description:
        "Wszystkie informacje dotyczące bezpieczeństwa, prywatności oraz zasad korzystania z Esteo w jednym miejscu.",
    },
    en: {
      title: "Trust Center",
      description:
        "Security, privacy, cookies, AI responsibility, and terms of use for Esteo in one place.",
    },
  },
  privacy: {
    pl: {
      title: "Polityka prywatności",
      description: "Jak Esteo przetwarza dane osobowe użytkowników i klientów workspace.",
    },
    en: {
      title: "Privacy Policy",
      description: "How Esteo processes personal data of users and workspace customers.",
    },
  },
  terms: {
    pl: {
      title: "Regulamin",
      description: "Warunki korzystania z aplikacji Esteo i subskrypcji workspace.",
    },
    en: {
      title: "Terms of Service",
      description: "Terms of use for the Esteo app and workspace subscriptions.",
    },
  },
  cookies: {
    pl: {
      title: "Polityka cookies",
      description: "Informacje o plikach cookies i zgodzie na analitykę w Esteo.",
    },
    en: {
      title: "Cookie Policy",
      description: "Information about cookies and analytics consent in Esteo.",
    },
  },
  ai: {
    pl: {
      title: "AI i odpowiedzialność",
      description:
        "Jak Esteo wykorzystuje AI w kosztorysach i jaka odpowiedzialność pozostaje po stronie użytkownika.",
    },
    en: {
      title: "AI & Responsibility",
      description:
        "How Esteo uses AI in estimates and which responsibilities remain with you as the user.",
    },
  },
};

export function getMarketingRoute(id: MarketingRouteId) {
  const route = siteConfig.launchRoutes.find((entry) => entry.id === id);
  if (!route) {
    throw new Error(`Unknown marketing route: ${id}`);
  }
  return route;
}
