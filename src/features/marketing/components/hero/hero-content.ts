import type { Locale } from "@/lib/locale";

export type HeroFeature = {
  title: string;
  description: string;
};

export type HeroPartnerLogo = {
  src: string;
  alt: string;
};

export type HeroContent = {
  badge: string;
  headlineLines: [string, string];
  highlight: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  socialProof: string;
  features: HeroFeature[];
  partnerLogo: HeroPartnerLogo;
};

export const heroContent: Record<Locale, HeroContent> = {
  pl: {
    badge: "AI ASYSTENT WYCEN",
    headlineLines: ["Twórz profesjonalne", "kosztorysy w minuty,"],
    highlight: "nie godziny.",
    description:
      "AI analizuje zapytania, generuje szkic wyceny, a Ty masz pełną kontrolę nad każdą pozycją. Od zapytania klienta do gotowego PDF w kilka minut.",
    primaryCta: "Zacznij tworzyć kosztorysy",
    secondaryCta: "Zobacz jak to działa",
    socialProof:
      "Dołącz do najszybciej rozwijających się firm, które oszczędzają czas i wygrywają więcej projektów.",
    features: [
      {
        title: "Szkic AI w sekundach",
        description: "AI tworzy wstępny kosztorys na podstawie zapytania klienta.",
      },
      {
        title: "Pełna kontrola",
        description:
          "Edytuj pozycje, ilości, ceny i marże bez ograniczeń. Skonfiguruj reguły pod Twoje wymagania.",
      },
      {
        title: "Profesjonalny PDF",
        description: "Eksportuj i wysyłaj gotowe kosztorysy jednym kliknięciem.",
      },
      {
        title: "Płatności i statusy",
        description: "Śledź płatności, zaliczki i status realizacji w jednym miejscu.",
      },
    ],
    partnerLogo: {
      src: "/images/marketing/alo-star-logo.png",
      alt: "Alo-Star Construction",
    },
  },
  en: {
    badge: "AI ESTIMATE ASSISTANT",
    headlineLines: ["Create professional", "estimates in minutes,"],
    highlight: "not hours.",
    description:
      "AI analyzes requests, generates an estimate draft, and you stay in control of every line item. From client inquiry to a ready PDF in minutes.",
    primaryCta: "Start creating estimates",
    secondaryCta: "See how it works",
    socialProof:
      "Join the fastest-growing companies that save time and win more projects.",
    features: [
      {
        title: "AI draft in seconds",
        description: "AI builds an initial estimate from the client's request.",
      },
      {
        title: "Full control",
        description:
          "Edit line items, quantities, prices, and margins without limits. Configure rules to match your requirements.",
      },
      {
        title: "Professional PDF",
        description: "Export and send finished estimates with one click.",
      },
      {
        title: "Payments and statuses",
        description: "Track payments, deposits, and delivery status in one place.",
      },
    ],
    partnerLogo: {
      src: "/images/marketing/alo-star-logo.png",
      alt: "Alo-Star Construction",
    },
  },
};
