import type { Locale } from "@/lib/locale";

export type FinalCtaTrustItem = {
  id: string;
  label: string;
};

export type FinalCtaContent = {
  eyebrow: string;
  titleBefore: string;
  titleHighlight: string;
  description: string;
  cta: string;
  trustItems: FinalCtaTrustItem[];
};

export const finalCtaContent: Record<Locale, FinalCtaContent> = {
  pl: {
    eyebrow: "GOTOWY NA WIĘCEJ?",
    titleBefore: "Twój kolejny kosztorys może powstać ",
    titleHighlight: "jeszcze dziś.",
    description: "Od pierwszego zapytania klienta do gotowego PDF - w jednym miejscu.",
    cta: "Zacznij za darmo",
    trustItems: [
      { id: "free_plan", label: "Plan FREE" },
      { id: "no_commitment", label: "Bez zobowiązań" },
      { id: "ai_calls", label: "10 wywołań AI miesięcznie" },
    ],
  },
  en: {
    eyebrow: "READY FOR MORE?",
    titleBefore: "Your next estimate could be ready ",
    titleHighlight: "as soon as today.",
    description: "From the first customer request to a finished PDF - all in one place.",
    cta: "Start for free",
    trustItems: [
      { id: "free_plan", label: "FREE plan" },
      { id: "no_commitment", label: "No commitment" },
      { id: "ai_calls", label: "10 AI calls per month" },
    ],
  },
};

export const FINAL_CTA_IMAGE_PATH = "/images/marketing/final-cta.webp";
