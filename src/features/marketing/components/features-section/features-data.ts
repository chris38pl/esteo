import type { Locale } from "@/lib/locale";

export type FeatureHighlightIconKey =
  | "sparkles"
  | "table"
  | "settings"
  | "file-text"
  | "mic"
  | "palette"
  | "globe";

export type FeatureHighlight = {
  iconKey: FeatureHighlightIconKey;
  title: string;
  description: string;
};

export type FeaturesContent = {
  titleBefore: string;
  titleHighlight: string;
  description: string;
  features: FeatureHighlight[];
};

export function getFeaturesContent(locale: Locale): FeaturesContent {
  if (locale === "pl") {
    return {
      titleBefore: "Wszystkie funkcje,",
      titleHighlight: "których potrzebujesz.",
      description:
        "Esteo łączy AI, automatyzację i wygodę w jednym narzędziu, abyś tworzył wyceny szybciej i pewniej.",
      features: [
        {
          iconKey: "sparkles",
          title: "AI tworzy szkic kosztorysu",
          description:
            "Opisz projekt własnymi słowami, a Esteo przygotuje kompletny szkic w kilkanaście sekund.",
        },
        {
          iconKey: "table",
          title: "Edytuj bez ograniczeń",
          description:
            "Dodawaj sekcje, zmieniaj ceny, ilości i marże w intuicyjnym edytorze.",
        },
        {
          iconKey: "settings",
          title: "Twórz własne reguły",
          description:
            "Ustaw domyślne sekcje i zasady wyceniania — AI będzie tworzyć kosztorysy tak, jak pracujesz na co dzień.",
        },
        {
          iconKey: "file-text",
          title: "PDF gotowy do wysłania",
          description:
            "Jednym kliknięciem wygeneruj elegancki kosztorys gotowy do wysłania lub wydruku.",
        },
        {
          iconKey: "mic",
          title: "Opowiedz o projekcie",
          description:
            "Dyktuj wymagania klienta, a Esteo zamieni je w gotowy opis inwestycji.",
        },
        {
          iconKey: "palette",
          title: "Twoja firma, Twój styl",
          description:
            "Wszystkie kosztorysy wyglądają profesjonalnie i budują rozpoznawalność Twojej marki.",
        },
        {
          iconKey: "globe",
          title: "Klient wysyła zapytanie 24/7",
          description:
            "Udostępnij formularz online i odbieraj kompletne zapytania nawet wtedy, gdy nie pracujesz.",
        },
      ],
    };
  }

  return {
    titleBefore: "All the features",
    titleHighlight: "you need.",
    description:
      "Esteo combines AI, automation, and convenience in one tool so you can create estimates faster and with more confidence.",
    features: [
      {
        iconKey: "sparkles",
        title: "AI drafts your estimate",
        description:
          "Describe the project in your own words and Esteo prepares a complete draft in seconds.",
      },
      {
        iconKey: "table",
        title: "Edit without limits",
        description:
          "Add sections and change prices, quantities, and margins in an intuitive editor.",
      },
      {
        iconKey: "settings",
        title: "Create your own rules",
        description:
          "Set default sections and pricing rules — AI will build estimates the way you already work.",
      },
      {
        iconKey: "file-text",
        title: "PDF ready to send",
        description:
          "Generate an elegant estimate ready to send or print with one click.",
      },
      {
        iconKey: "mic",
        title: "Tell us about the project",
        description:
          "Dictate client requirements and Esteo turns them into a ready project description.",
      },
      {
        iconKey: "palette",
        title: "Your company, your style",
        description:
          "Every estimate looks professional and builds recognition for your brand.",
      },
      {
        iconKey: "globe",
        title: "Clients submit inquiries 24/7",
        description:
          "Share an online form and receive complete requests even when you are not working.",
      },
    ],
  };
}
