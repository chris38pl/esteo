import type { Locale } from "@/lib/locale";

export function buildReferralShareMessage(locale: Locale, link: string): string {
  if (locale === "pl") {
    return [
      "Polecam Esteo do kosztorysów i wycen.",
      "Jeśli założysz konto z mojego linku,",
      "otrzymasz 20% zniżki przez 3 miesiące.",
      "",
      link,
    ].join("\n");
  }

  return [
    "I recommend Esteo for estimates and quoting.",
    "Sign up with my link to get 20% off for 3 months.",
    "",
    link,
  ].join("\n");
}

export function buildReferralLink(locale: Locale, code: string): string {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "https://esteo.app"
  ).replace(/\/$/, "");
  return `${base}/${locale}/r/${encodeURIComponent(code)}`;
}
