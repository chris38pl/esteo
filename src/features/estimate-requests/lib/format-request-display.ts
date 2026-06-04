import {
  getStartDateLabel,
  START_DATE_KEYS,
  type StartDateKey,
} from "@/features/estimate-requests/config/start-dates";
import {
  getVoivodeshipLabel,
  VOIVODESHIP_KEYS,
  type VoivodeshipKey,
} from "@/features/estimate-requests/config/voivodeships";
import type { Locale } from "@/lib/locale";

function isStartDateKey(value: string): value is StartDateKey {
  return (START_DATE_KEYS as readonly string[]).includes(value);
}

function isVoivodeshipKey(value: string): value is VoivodeshipKey {
  return (VOIVODESHIP_KEYS as readonly string[]).includes(value);
}

export function formatPreferredStartDate(value: string | undefined, locale: Locale): string {
  if (!value?.trim()) {
    return "—";
  }
  return isStartDateKey(value) ? getStartDateLabel(value, locale) : value;
}

export function formatVoivodeship(value: string | undefined, locale: Locale): string {
  if (!value?.trim()) {
    return "—";
  }
  return isVoivodeshipKey(value) ? getVoivodeshipLabel(value, locale) : value;
}
