import type { Locale } from "@/lib/locale";

import { siteConfig } from "@/features/marketing/seo/site-config";

export type ContactContent = {
  pageTitle: string;
  pageDescription: string;
  eyebrow: string;
  title: string;
  description: string;
  emailLabel: string;
  email: string;
  responseTime: string;
  faqHint: string;
  faqCta: string;
};

export const contactContent: Record<Locale, ContactContent> = {
  pl: {
    pageTitle: "Kontakt",
    pageDescription: "Skontaktuj się z zespołem Esteo w sprawie produktu, rozliczeń lub wsparcia.",
    eyebrow: "Kontakt",
    title: "Napisz do nas",
    description:
      "Masz pytanie o produkt, plany lub wsparcie techniczne? Napisz - odpowiadamy w dni robocze.",
    emailLabel: "E-mail",
    email: siteConfig.supportEmail,
    responseTime: "Zwykle odpowiadamy w ciągu 1–2 dni roboczych.",
    faqHint: "Sprawdź też FAQ - wiele pytań o AI, PDF i plany jest tam już opisanych.",
    faqCta: "Przejdź do FAQ",
  },
  en: {
    pageTitle: "Contact",
    pageDescription: "Contact the Esteo team about the product, billing, or support.",
    eyebrow: "Contact",
    title: "Get in touch",
    description:
      "Questions about the product, plans, or technical support? Email us - we reply on business days.",
    emailLabel: "Email",
    email: siteConfig.supportEmail,
    responseTime: "We usually reply within 1–2 business days.",
    faqHint: "Check the FAQ - many questions about AI, PDF, and plans are already answered there.",
    faqCta: "Go to FAQ",
  },
};
