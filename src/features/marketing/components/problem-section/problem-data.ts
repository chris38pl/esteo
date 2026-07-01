import type { Locale } from "@/lib/locale";

export type ProblemFeatureIconKey = "database" | "calculator" | "users" | "file-x";

export type ProblemBubbleIconKey = "frown" | "file-search" | "user-x" | "clock";

export type ProblemBubble = {
  iconKey: ProblemBubbleIconKey;
  line1: string;
  line2: string;
};

export type ProblemFeature = {
  iconKey: ProblemFeatureIconKey;
  title: string;
  description: string;
};

export type ProblemContent = {
  titleBefore: string;
  titleHighlight: string;
  titleAfter: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  bubbles: ProblemBubble[];
  features: ProblemFeature[];
};

const problemImages = {
  pl: "/images/marketing/problem/old-estimate-pl.webp",
  en: "/images/marketing/problem/old-estimate-en.webp",
} as const;

export function getProblemContent(locale: Locale): ProblemContent {
  if (locale === "pl") {
    return {
      titleBefore: "Ręczne wyceny ",
      titleHighlight: "spowalniają",
      titleAfter: " Twój biznes.",
      description:
        "Chaos w danych, błędy i nieprofesjonalne dokumenty to codzienność, która kosztuje Twój biznes więcej, niż myślisz.",
      imageSrc: problemImages.pl,
      imageAlt: "Pomięty arkusz kalkulacyjny z błędami i poprawkami",
      bubbles: [
        { iconKey: "frown", line1: "Znowu coś", line2: "przeliczyć…" },
        { iconKey: "file-search", line1: "Gdzie jest ta", line2: "najnowsza wersja?" },
        { iconKey: "user-x", line1: "Klient prosi o poprawki", line2: "już po wysłaniu…" },
        { iconKey: "clock", line1: "Nie mam czasu", line2: "na nic innego…" },
      ],
      features: [
        {
          iconKey: "database",
          title: "Rozproszone dane",
          description: "Informacje w wielu plikach bez spójnej struktury",
        },
        {
          iconKey: "calculator",
          title: "Ręczne wyliczenia",
          description: "Łatwo o błąd, trudno o kontrolę.",
        },
        {
          iconKey: "users",
          title: "Trudne poprawki",
          description: "Zmiany wymagają wielu godzin pracy.",
        },
        {
          iconKey: "file-x",
          title: "PDF bez wrażenia",
          description: "Wygląd dokumentu nie buduje zaufania.",
        },
      ],
    };
  }

  return {
    titleBefore: "Spreadsheets ",
    titleHighlight: "slow down",
    titleAfter: " your business.",
    description:
      "Data chaos, spreadsheet errors, and unprofessional documents cost your business more than you think.",
    imageSrc: problemImages.en,
    imageAlt: "Crumpled spreadsheet with errors and corrections",
    bubbles: [
      { iconKey: "frown", line1: "Need to calculate", line2: "something again…" },
      { iconKey: "file-search", line1: "Where is the", line2: "latest version?" },
      { iconKey: "user-x", line1: "Client wants changes", line2: "after we sent it…" },
      { iconKey: "clock", line1: "No time for", line2: "anything else…" },
    ],
    features: [
      {
        iconKey: "database",
        title: "Scattered data",
        description: "Information spread across many files without structure.",
      },
      {
        iconKey: "calculator",
        title: "Manual calculations",
        description: "Easy to make mistakes, hard to stay in control.",
      },
      {
        iconKey: "users",
        title: "Painful revisions",
        description: "Changes take hours of work.",
      },
      {
        iconKey: "file-x",
        title: "PDFs that underwhelm",
        description: "Document appearance does not build trust.",
      },
    ],
  };
}
