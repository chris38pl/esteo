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
  product_categories: {
    kitchen: {
      pl: { label: "Kuchnia", description: "zabudowa kuchenna" },
      en: { label: "Kitchen", description: "kitchen cabinetry" },
    },
    wardrobe: {
      pl: { label: "Szafa", description: "szafa lub zabudowa" },
      en: { label: "Wardrobe", description: "wardrobe or closet unit" },
    },
    closet: {
      pl: { label: "Garderoba", description: "garderoba walk-in" },
      en: { label: "Closet", description: "walk-in closet" },
    },
    bathroom: {
      pl: { label: "Łazienka", description: "meble łazienkowe" },
      en: { label: "Bathroom", description: "bathroom furniture" },
    },
    office: {
      pl: { label: "Biuro", description: "meble biurowe" },
      en: { label: "Office", description: "office furniture" },
    },
    reception: {
      pl: { label: "Recepcja", description: "zabudowa recepcji" },
      en: { label: "Reception", description: "reception desk" },
    },
    commercial: {
      pl: { label: "Zabudowa komercyjna", description: "sklepy, hotele, gastronomia" },
      en: { label: "Commercial fit-out", description: "retail, hotels, hospitality" },
    },
    other: {
      pl: { label: "Inne", description: "inny typ zabudowy" },
      en: { label: "Other", description: "other fit-out type" },
    },
  },
  project_types: {
    new_build: {
      pl: { label: "Nowa zabudowa", description: "kompletna realizacja" },
      en: { label: "New build", description: "full new installation" },
    },
    extension: {
      pl: { label: "Rozbudowa istniejącej", description: "dopasowanie do istniejącej" },
      en: { label: "Extension", description: "extend existing" },
    },
    front_replacement: {
      pl: { label: "Wymiana frontów", description: "fronty bez pełnych korpusów" },
      en: { label: "Front replacement", description: "fronts only" },
    },
    renovation: {
      pl: { label: "Renowacja", description: "naprawa i odświeżenie" },
      en: { label: "Renovation", description: "repair and refresh" },
    },
    service: {
      pl: { label: "Serwis", description: "serwis i drobne naprawy" },
      en: { label: "Service", description: "service and minor repairs" },
    },
    other: {
      pl: { label: "Inny", description: "doprecyzuj w opisie projektu" },
      en: { label: "Other", description: "describe in the project brief" },
    },
    new_installation: {
      pl: { label: "Nowa instalacja", description: "nowy obiekt lub pełna wymiana" },
      en: { label: "New installation", description: "new build or full replacement" },
    },
    photovoltaic: {
      pl: { label: "Fotowoltaika", description: "instalacja PV" },
      en: { label: "Photovoltaic", description: "PV installation" },
    },
    smart_home: {
      pl: { label: "Smart Home", description: "automatyka i sterowanie" },
      en: { label: "Smart home", description: "automation and controls" },
    },
    measurements: {
      pl: { label: "Pomiary", description: "pomiary i odbiory" },
      en: { label: "Testing", description: "measurements and commissioning" },
    },
  },
  budget_tier: {
    economy: {
      pl: { label: "Ekonomiczny", description: "GTV, laminat, podstawowe okucia" },
      en: { label: "Economy", description: "GTV, laminate, basic hardware" },
    },
    standard: {
      pl: { label: "Standard", description: "mix jakościowy" },
      en: { label: "Standard", description: "balanced quality" },
    },
    premium: {
      pl: { label: "Premium", description: "Blum, lakier, lepsze blaty" },
      en: { label: "Premium", description: "Blum, lacquer, better worktops" },
    },
    luxury: {
      pl: { label: "Luxury", description: "fornir, systemy top" },
      en: { label: "Luxury", description: "veneer, top systems" },
    },
  },
  building_type: {
    house: {
      pl: { label: "Dom jednorodzinny", description: "instalacja domowa" },
      en: { label: "Single-family house", description: "residential home" },
    },
    apartment: {
      pl: { label: "Mieszkanie", description: "lokal mieszkalny" },
      en: { label: "Apartment", description: "residential flat" },
    },
    commercial: {
      pl: { label: "Lokal usługowy", description: "handel, usługi" },
      en: { label: "Commercial unit", description: "retail or services" },
    },
    industrial: {
      pl: { label: "Hala / przemysł", description: "obiekt przemysłowy" },
      en: { label: "Industrial hall", description: "industrial facility" },
    },
    other: {
      pl: { label: "Inne", description: "inny typ obiektu" },
      en: { label: "Other", description: "other building type" },
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
