import type { Locale } from "@/lib/locale";

type OptionLocaleEntry = { label: string; description: string };
type OptionLocales = Record<Locale, OptionLocaleEntry>;
type FieldOptions = Record<string, OptionLocales>;

const INDUSTRY_OPTION_LABELS: Record<string, FieldOptions> = {
  property_type: {
    house: {
      pl: { label: "Dom", description: "wykończenie kompleksowe" },
      en: { label: "House", description: "complete finishing" },
    },
    apartment: {
      pl: { label: "Mieszkanie", description: "wykończenie pod klucz" },
      en: { label: "Apartment", description: "turnkey finishing" },
    },
    office: {
      pl: { label: "Biuro", description: "fit-out komercyjny" },
      en: { label: "Office", description: "commercial fit-out" },
    },
    commercial: {
      pl: { label: "Lokal usługowy", description: "gastronomia, retail" },
      en: { label: "Service unit", description: "restaurant, retail" },
    },
    other: {
      pl: { label: "Inne", description: "nietypowy projekt" },
      en: { label: "Other", description: "non-standard project" },
    },
  },
};

function humanize(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getIndustryOptionLabel(
  fieldKey: string,
  optionValue: string,
  locale: Locale,
  property: "label" | "description",
): string {
  const entry = INDUSTRY_OPTION_LABELS[fieldKey]?.[optionValue]?.[locale];
  if (!entry) {
    return property === "label" ? humanize(optionValue) : "";
  }
  return entry[property];
}
