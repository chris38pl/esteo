export type ScopeCanonicalGroup = {
  id: string;
  terms: string[];
};

/** Canonical scope groups for benchmark scoring and analytics — not for UI label replacement. */
export const SCOPE_CANONICAL_GROUPS: ScopeCanonicalGroup[] = [
  {
    id: "elektryka",
    terms: [
      "elektryka",
      "elektryczna",
      "elektryczne",
      "elektryczny",
      "instalacja elektryczna",
      "electrical",
      "electrics",
      "wiring",
    ],
  },
  {
    id: "podlogi",
    terms: ["podlogi", "podloga", "podłogi", "podłoga", "wymiana podłóg", "flooring", "floor"],
  },
  {
    id: "dach",
    terms: ["dach", "dachu", "wymiana dachu", "dachówka", "dachowka", "rynny", "roof", "roofing", "gutters"],
  },
  {
    id: "lazienka",
    terms: ["łazienka", "lazienka", "łazienki", "remont łazienki", "bathroom", "bath"],
  },
  {
    id: "elewacja",
    terms: [
      "elewacja",
      "elewacji",
      "remont elewacji",
      "wymiana elewacji",
      "facade",
      "elevation",
    ],
  },
  {
    id: "okna",
    terms: ["okna", "okno", "wymiana okien", "parapety", "parapet", "windows", "window"],
  },
  {
    id: "malowanie",
    terms: ["malowanie", "malowac", "painting", "paint", "farba"],
  },
  {
    id: "gladzie",
    terms: ["gładzie", "gladzie", "gipsowe", "plaster", "drywall"],
  },
  {
    id: "hydraulika",
    terms: ["hydraulika", "hydraulic", "plumbing", "rury"],
  },
  {
    id: "gaz",
    terms: ["gaz", "gazowa", "gazowej", "instalacji gazowej", "gas"],
  },
  {
    id: "co",
    terms: [
      "co",
      "centralne ogrzewanie",
      "centralnego ogrzewania",
      "ogrzewanie",
      "ogrzewania",
      "heating",
      "hvac",
    ],
  },
  {
    id: "ocieplenie",
    terms: ["ocieplenie", "izolacja", "insulation"],
  },
  {
    id: "tynk",
    terms: ["tynk", "tynki", "tynkowanie", "render"],
  },
  {
    id: "posadzka",
    terms: ["posadzka", "posadzki", "flooring industrial", "industrial floor"],
  },
  {
    id: "witryna",
    terms: ["witryna", "witryny", "shopfront", "storefront"],
  },
  {
    id: "sufit",
    terms: ["sufit", "sufity", "sufit podwieszany", "ceiling", "suspended ceiling"],
  },
  {
    id: "oswietlenie",
    terms: ["oświetlenie", "oswietlenie", "led", "lighting", "lights"],
  },
  {
    id: "plytki",
    terms: ["płytki", "plytki", "kafelki", "tiles", "tiling"],
  },
  {
    id: "armatura",
    terms: ["armatura", "fixtures", "sanitary"],
  },
  {
    id: "kuchnia",
    terms: ["kuchnia", "kuchni", "kitchen"],
  },
  {
    id: "remont",
    terms: ["remont", "remont generalny", "renovation", "general renovation"],
  },
  {
    id: "siec",
    terms: ["sieć", "siec", "network", "computer network", "data"],
  },
  {
    id: "tapetowanie",
    terms: ["tapetowanie", "tapeta", "wallpaper"],
  },
];

export function normalizeScopeLabel(value: string): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function termMatchesLabel(term: string, label: string): boolean {
  const normalizedTerm = normalizeScopeLabel(term);
  const normalizedLabel = normalizeScopeLabel(label);
  if (!normalizedTerm || !normalizedLabel) return false;
  return (
    normalizedLabel.includes(normalizedTerm) ||
    normalizedTerm.includes(normalizedLabel)
  );
}

export function resolveScopeCanonicalId(label: string): string | null {
  const normalized = normalizeScopeLabel(label);
  if (!normalized) return null;

  for (const group of SCOPE_CANONICAL_GROUPS) {
    if (group.terms.some((term) => termMatchesLabel(term, normalized))) {
      return group.id;
    }
  }

  return null;
}

export function scopeLabelsMatch(expected: string, actual: string): boolean {
  const expectedId = resolveScopeCanonicalId(expected);
  const actualId = resolveScopeCanonicalId(actual);

  if (expectedId && actualId) {
    return expectedId === actualId;
  }

  const normalizedExpected = normalizeScopeLabel(expected);
  const normalizedActual = normalizeScopeLabel(actual);
  return (
    normalizedExpected.includes(normalizedActual) ||
    normalizedActual.includes(normalizedExpected)
  );
}
