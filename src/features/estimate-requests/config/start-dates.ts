import type { Locale } from "@/lib/locale";

const START_DATES = {
  asap: { pl: "Jak najszybciej", en: "As soon as possible" },
  "1_3_months": { pl: "1-3 miesiące", en: "1-3 months" },
  "3_6_months": { pl: "3-6 miesięcy", en: "3-6 months" },
  "6_12_months": { pl: "6-12 miesięcy", en: "6-12 months" },
  flexible: { pl: "Termin elastyczny", en: "Flexible date" },
} as const;

export type StartDateKey = keyof typeof START_DATES;

export const START_DATE_KEYS = Object.keys(START_DATES) as StartDateKey[];

export function getStartDateLabel(key: StartDateKey, locale: Locale): string {
  return START_DATES[key][locale];
}
