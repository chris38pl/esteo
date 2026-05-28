import type { WorkspaceLocale } from "@prisma/client";

import type { Locale } from "@/lib/locale";

export function workspaceLocaleToAppLocale(locale: WorkspaceLocale): Locale {
  return locale === "EN" ? "en" : "pl";
}

export function appLocaleToWorkspaceLocale(locale: Locale): WorkspaceLocale {
  return locale === "en" ? "EN" : "PL";
}

export function parseWorkspaceLocale(value: string | null | undefined): WorkspaceLocale {
  if (value?.toUpperCase() === "EN") {
    return "EN";
  }

  return "PL";
}
