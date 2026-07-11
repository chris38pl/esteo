"use client";

import { Button } from "@/components/ui/button";
import { getCookieConsentContent } from "@/features/marketing/content/cookie-consent-content";
import type { Locale } from "@/lib/locale";

import { useCookieConsent } from "./cookie-consent-provider";

export function CookieConsentSettingsButton({ locale }: { locale: Locale }) {
  const content = getCookieConsentContent(locale);
  const { openPreferences } = useCookieConsent();

  return (
    <Button type="button" variant="outline" size="sm" onClick={openPreferences}>
      {content.changeSettings}
    </Button>
  );
}
