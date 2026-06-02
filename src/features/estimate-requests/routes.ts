import type { Locale } from "@/lib/locale";

export const publicEstimateRequestSegmentByLocale: Record<Locale, string> = {
  pl: "wycena",
  en: "estimate-request",
};

export function getPublicEstimateRequestPath(locale: Locale, workspaceSlug: string) {
  return `/${locale}/${publicEstimateRequestSegmentByLocale[locale]}/${workspaceSlug}`;
}

