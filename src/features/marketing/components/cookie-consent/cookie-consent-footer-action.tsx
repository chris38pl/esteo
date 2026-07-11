"use client";

import { Settings2 } from "lucide-react";

import { getCookieConsentContent } from "@/features/marketing/content/cookie-consent-content";
import type { Locale } from "@/lib/locale";

import { useCookieConsent } from "./cookie-consent-provider";

export function CookieConsentFooterAction({ locale }: { locale: Locale }) {
  const content = getCookieConsentContent(locale);
  const { openPreferences } = useCookieConsent();

  return (
    <li>
      <button
        type="button"
        onClick={openPreferences}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        aria-expanded={false}
      >
        <Settings2 className="size-3.5" aria-hidden />
        {content.footerPreferences}
      </button>
    </li>
  );
}
