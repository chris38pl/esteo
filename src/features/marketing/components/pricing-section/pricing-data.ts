import type { SubscriptionPlan } from "@prisma/client";

import { formatBytes } from "@/features/attachments/lib/format-bytes";
import { formatBillingMonthlyPrice } from "@/features/billing/lib/format-billing-amount";
import type { Locale } from "@/lib/locale";
import { resolvePlanLimits } from "@/server/billing/plan-catalog";
import { resolveCurrentPlanPrice } from "@/server/billing/plan-pricing";

export type PricingPlanId = SubscriptionPlan;

export type PricingPlan = {
  id: PricingPlanId;
  name: string;
  /** Audience positioning - who the plan is for. */
  tagline: string;
  price: string;
  pricePeriod: string;
  /** Benefit bullets, grouped for faster scanning. */
  featureGroups: string[][];
  cta: string;
  highlighted?: boolean;
  popularBadge?: string;
};

export type PricingTrustItem = {
  title: string;
  description: string;
};

export type PricingContent = {
  eyebrow: string;
  titleBefore: string;
  titleHighlight: string;
  description: string;
  plans: PricingPlan[];
  trust: PricingTrustItem[];
  stripeNote: string;
};

function planPriceLabel(plan: PricingPlanId, locale: Locale): string {
  if (plan === "FREE") {
    return locale === "pl" ? "0 zł" : "PLN 0";
  }
  return formatBillingMonthlyPrice(resolveCurrentPlanPrice(plan), locale);
}

function buildFreeFeatureGroups(locale: Locale): string[][] {
  const limits = resolvePlanLimits("FREE");

  if (locale === "pl") {
    return [
      [
        "Publiczny formularz kontaktowy wycen",
        `${limits.maxEstimatesPerMonth} kosztorysy miesięcznie`,
        `${limits.maxAiAssistantCallsPerMonth} wywołań AI`,
        "PDF ze znakiem wodnym",
        `${formatBytes(limits.maxStorageBytes)} na pliki`,
      ],
    ];
  }

  return [
    [
      "Public estimate inquiry form",
      `${limits.maxEstimatesPerMonth} estimates per month`,
      `${limits.maxAiAssistantCallsPerMonth} AI calls`,
      "PDF with watermark",
      `${formatBytes(limits.maxStorageBytes)} storage`,
    ],
  ];
}

function buildProFeatureGroups(locale: Locale): string[][] {
  const limits = resolvePlanLimits("PRO");
  const storage = formatBytes(limits.maxStorageBytes);

  if (locale === "pl") {
    return [
      ["Nielimitowane kosztorysy", "Nielimitowane wykorzystanie AI"],
      [
        "Profesjonalne PDF bez znaku wodnego",
        "Własne logo firmy",
        "Własne szablony oraz cenniki",
      ],
      ["Historia zmian", `${storage} załączników`],
    ];
  }

  return [
    ["Unlimited estimates", "Unlimited AI usage"],
    [
      "Professional PDFs without watermark",
      "Your company logo",
      "Your own templates and price lists",
    ],
    ["Change history", `${storage} for attachments`],
  ];
}

function buildBusinessFeatureGroups(locale: Locale): string[][] {
  const limits = resolvePlanLimits("BUSINESS");
  const teamSize = (limits.maxInvitedSeats ?? 0) + 1;

  if (locale === "pl") {
    return [
      [
        `Do ${teamSize} użytkowników`,
        "Wspólna baza kosztorysów",
        "Zarządzanie zespołem",
      ],
      [
        "Wszystko z PRO",
        "Więcej przestrzeni na pliki",
        "Priorytetowe wsparcie",
        "Rozbudowa o kolejne miejsca",
      ],
    ];
  }

  return [
    [
      `Up to ${teamSize} users`,
      "Shared estimate library",
      "Team management",
    ],
    [
      "Everything in PRO",
      "More file storage",
      "Priority support",
      "Add more seats as you grow",
    ],
  ];
}

export function getPricingContent(locale: Locale): PricingContent {
  if (locale === "pl") {
    return {
      eyebrow: "#CENNIK",
      titleBefore: "Wybierz plan dopasowany do ",
      titleHighlight: "Twojej firmy",
      description:
        "Proste ceny. Zero ukrytych opłat. Zmień lub anuluj w dowolnym momencie.",
      plans: [
        {
          id: "FREE",
          name: "FREE",
          tagline: "Wypróbuj Esteo",
          price: planPriceLabel("FREE", locale),
          pricePeriod: "na zawsze",
          featureGroups: buildFreeFeatureGroups(locale),
          cta: "Zacznij za darmo",
        },
        {
          id: "PRO",
          name: "PRO",
          tagline: "Dla firm, które regularnie przygotowują oferty",
          price: planPriceLabel("PRO", locale),
          pricePeriod: "netto / miesiąc",
          highlighted: true,
          popularBadge: "Najczęściej wybierany",
          featureGroups: buildProFeatureGroups(locale),
          cta: "Wybierz plan Pro",
        },
        {
          id: "BUSINESS",
          name: "BUSINESS",
          tagline: "Dla zespołów pracujących wspólnie",
          price: planPriceLabel("BUSINESS", locale),
          pricePeriod: "netto / miesiąc",
          featureGroups: buildBusinessFeatureGroups(locale),
          cta: "Wybierz plan Business",
        },
      ],
      trust: [
        {
          title: "Bezpieczne dane",
          description: "Twoje dane są szyfrowane i chronione na każdym etapie.",
        },
        {
          title: "Bez zobowiązań",
          description: "Zmień plan lub anuluj w dowolnym momencie.",
        },
        {
          title: "Jedna subskrypcja",
          description: "Plan obejmuje cały workspace - nie pojedynczy projekt.",
        },
      ],
      stripeNote: "Płatności obsługuje Stripe. Gwarancja bezpieczeństwa.",
    };
  }

  return {
    eyebrow: "#PRICING",
    titleBefore: "Choose a plan that fits ",
    titleHighlight: "your business",
    description: "Simple pricing. No hidden fees. Change or cancel anytime.",
    plans: [
      {
        id: "FREE",
        name: "FREE",
        tagline: "Try Esteo",
        price: planPriceLabel("FREE", locale),
        pricePeriod: "forever",
        featureGroups: buildFreeFeatureGroups(locale),
        cta: "Start for free",
      },
      {
        id: "PRO",
        name: "PRO",
        tagline: "For companies that prepare offers regularly",
        price: planPriceLabel("PRO", locale),
        pricePeriod: "excl. VAT / month",
        highlighted: true,
        popularBadge: "Most popular",
        featureGroups: buildProFeatureGroups(locale),
        cta: "Choose Pro",
      },
      {
        id: "BUSINESS",
        name: "BUSINESS",
        tagline: "For teams working together",
        price: planPriceLabel("BUSINESS", locale),
        pricePeriod: "excl. VAT / month",
        featureGroups: buildBusinessFeatureGroups(locale),
        cta: "Choose Business",
      },
    ],
    trust: [
      {
        title: "Secure data",
        description: "Your data is encrypted and protected at every step.",
      },
      {
        title: "No commitment",
        description: "Change your plan or cancel at any time.",
      },
      {
        title: "One subscription",
        description: "Your plan covers the whole workspace - not a single project.",
      },
    ],
    stripeNote: "Payments are processed by Stripe. Security guaranteed.",
  };
}
