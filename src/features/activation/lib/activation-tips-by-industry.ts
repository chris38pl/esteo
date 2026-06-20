import type { WorkspaceIndustry } from "@prisma/client";

import type { Locale } from "@/lib/locale";

export type ActivationTip = {
  id: string;
  pl: string;
  en: string;
};

const DEFAULT_TIPS: ActivationTip[] = [
  {
    id: "send_estimate",
    pl: "Wyślij gotową wycenę bezpośrednio z Esteo",
    en: "Send a finished estimate directly from Esteo",
  },
  {
    id: "logo_pdf",
    pl: "Dodaj logo firmy do PDF",
    en: "Add your company logo to PDF exports",
  },
  {
    id: "form_website",
    pl: "Umieść formularz na swojej stronie internetowej",
    en: "Embed the client form on your website",
  },
];

const TIPS_BY_INDUSTRY: Record<WorkspaceIndustry, ActivationTip[]> = {
  CONSTRUCTION: DEFAULT_TIPS,
  CARPENTRY: DEFAULT_TIPS,
  ELECTRICAL: DEFAULT_TIPS,
  PLUMBING: DEFAULT_TIPS,
  OTHER: DEFAULT_TIPS,
};

export function getActivationTipsForIndustry(
  industry: WorkspaceIndustry,
  locale: Locale,
): Array<{ id: string; text: string }> {
  const tips = TIPS_BY_INDUSTRY[industry] ?? DEFAULT_TIPS;
  return tips.map((tip) => ({
    id: tip.id,
    text: locale === "pl" ? tip.pl : tip.en,
  }));
}
