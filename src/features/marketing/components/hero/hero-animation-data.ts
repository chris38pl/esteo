import type { Locale } from "@/lib/locale";

export type EstimateLineItem = {
  id: string;
  name: string;
  amount: number;
};

export type EstimateSectionData = {
  id: string;
  title: string;
  lines: EstimateLineItem[];
};

export type HeroAnimationContent = {
  appLabel: string;
  estimateTitle: string;
  status: string;
  requestLabel: string;
  analysisLabel: string;
  draftReady: string;
  requestLines: string[];
  sections: EstimateSectionData[];
  summaryLabels: {
    net: string;
    vat: string;
    gross: string;
  };
  assistant: {
    title: string;
    status: string;
    welcome: string;
    user: string;
    thinking: string;
    generating: string;
    ai: string;
    success: string;
    inputPlaceholder: string;
    timestamp: string;
  };
};

export const heroAnimationContent: Record<Locale, HeroAnimationContent> = {
  pl: {
    appLabel: "Esteo",
    estimateTitle: "Wycena łazienki",
    status: "Draft",
    requestLabel: "Zapytanie klienta",
    analysisLabel: "Analiza AI",
    draftReady: "✓ Draft gotowy",
    requestLines: ["Remont łazienki 8m²", "prysznic walk-in", "oświetlenie LED"],
    sections: [
      {
        id: "demolition",
        title: "Demontaż",
        lines: [
          { id: "tiles", name: "Usunięcie starej glazury", amount: 540 },
          { id: "fixtures", name: "Demontaż armatury i ceramiki", amount: 520 },
        ],
      },
      {
        id: "plumbing",
        title: "Hydraulika",
        lines: [
          { id: "shower", name: "Montaż prysznica", amount: 2400 },
          { id: "drain", name: "Montaż odpływu", amount: 980 },
          { id: "retrofit", name: "Przeróbka instalacji wodnej i kanalizacyjnej", amount: 1580 },
        ],
      },
      {
        id: "finishing",
        title: "Wykończenie",
        lines: [
          { id: "tiles", name: "Układanie płytek gresowych", amount: 1710 },
          { id: "waterproofing", name: "System hydroizolacji", amount: 456 },
        ],
      },
      {
        id: "electrical",
        title: "Instalacje elektryczne",
        lines: [
          { id: "led", name: "Oświetlenie LED w suficie podwieszanym", amount: 540 },
          { id: "points", name: "Punkt elektryczny osprzętu", amount: 540 },
        ],
      },
    ],
    summaryLabels: {
      net: "Netto",
      vat: "VAT",
      gross: "Brutto",
    },
    assistant: {
      title: "Asystent AI",
      status: "Gotowy do pomocy",
      welcome:
        "Cześć! Pomogę zmienić dowolną pozycję w wycenie — napisz, czego potrzebujesz.",
      user: "Zmień prysznic na wannę.",
      thinking: "Analizuję zmianę…",
      generating: "Analizuję zapytanie i generuję kosztorys…",
      ai: "Jasne. Zaktualizowałem pozycję w sekcji Hydraulika.",
      success: "Wycena gotowa do wysłania.",
      inputPlaceholder: "Napisz wiadomość…",
      timestamp: "09:41",
    },
  },
  en: {
    appLabel: "Esteo",
    estimateTitle: "Bathroom estimate",
    status: "Draft",
    requestLabel: "Client request",
    analysisLabel: "AI analysis",
    draftReady: "✓ Draft ready",
    requestLines: ["Bathroom renovation 8m²", "walk-in shower", "LED lighting"],
    sections: [
      {
        id: "demolition",
        title: "Demolition",
        lines: [
          { id: "tiles", name: "Remove old wall tiles", amount: 850 },
          { id: "fixtures", name: "Remove fixtures and sanitary ware", amount: 520 },
        ],
      },
      {
        id: "plumbing",
        title: "Plumbing",
        lines: [
          { id: "shower", name: "Shower installation", amount: 2400 },
          { id: "drain", name: "Drain installation", amount: 980 },
          { id: "retrofit", name: "Water and sewer line modifications", amount: 1580 },
        ],
      },
      {
        id: "finishing",
        title: "Finishing",
        lines: [
          { id: "tiles", name: "Porcelain tile installation", amount: 1710 },
          { id: "waterproofing", name: "Waterproofing system", amount: 456 },
        ],
      },
      {
        id: "electrical",
        title: "Electrical",
        lines: [
          { id: "led", name: "LED lighting in suspended ceiling", amount: 540 },
          { id: "points", name: "Fixture electrical points", amount: 540 },
        ],
      },
    ],
    summaryLabels: {
      net: "Net",
      vat: "VAT",
      gross: "Gross",
    },
    assistant: {
      title: "AI Assistant",
      status: "Ready to help",
      welcome: "Hi! Tell me what to change in your estimate — I'll handle the rest.",
      user: "Change the shower to a bathtub.",
      thinking: "Reviewing your change…",
      generating: "Analyzing your request and generating the estimate…",
      ai: "Sure. I've updated the item in the Plumbing section.",
      success: "Estimate ready to send.",
      inputPlaceholder: "Write a message…",
      timestamp: "09:41",
    },
  },
};

export const summaryValues = {
  net: 7530,
  vat: 1731.9,
  gross: 9261.9,
};
