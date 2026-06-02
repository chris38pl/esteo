import type { Locale } from "@/lib/locale";

const VOIVODESHIPS = {
  dolnoslaskie: { pl: "Dolnośląskie", en: "Lower Silesian" },
  kujawsko_pomorskie: { pl: "Kujawsko-pomorskie", en: "Kuyavian-Pomeranian" },
  lubelskie: { pl: "Lubelskie", en: "Lublin" },
  lubuskie: { pl: "Lubuskie", en: "Lubusz" },
  lodzkie: { pl: "Łódzkie", en: "Lodz" },
  malopolskie: { pl: "Małopolskie", en: "Lesser Poland" },
  mazowieckie: { pl: "Mazowieckie", en: "Masovian" },
  opolskie: { pl: "Opolskie", en: "Opole" },
  podkarpackie: { pl: "Podkarpackie", en: "Subcarpathian" },
  podlaskie: { pl: "Podlaskie", en: "Podlaskie" },
  pomorskie: { pl: "Pomorskie", en: "Pomeranian" },
  slaskie: { pl: "Śląskie", en: "Silesian" },
  swietokrzyskie: { pl: "Świętokrzyskie", en: "Swietokrzyskie" },
  warminsko_mazurskie: { pl: "Warmińsko-mazurskie", en: "Warmian-Masurian" },
  wielkopolskie: { pl: "Wielkopolskie", en: "Greater Poland" },
  zachodniopomorskie: { pl: "Zachodniopomorskie", en: "West Pomeranian" },
} as const;

export type VoivodeshipKey = keyof typeof VOIVODESHIPS;

export const VOIVODESHIP_KEYS = Object.keys(VOIVODESHIPS) as VoivodeshipKey[];

export function getVoivodeshipLabel(key: VoivodeshipKey, locale: Locale): string {
  return VOIVODESHIPS[key][locale];
}
