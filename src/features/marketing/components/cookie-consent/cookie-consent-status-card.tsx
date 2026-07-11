"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCookieConsentContent } from "@/features/marketing/content/cookie-consent-content";
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  getConsentSummary,
  type CookieConsentSummary,
} from "@/features/marketing/lib/cookie-consent";
import type { Locale } from "@/lib/locale";

import { useCookieConsent } from "./cookie-consent-provider";

export function CookieConsentStatusCard({ locale }: { locale: Locale }) {
  const content = getCookieConsentContent(locale);
  const { openPreferences } = useCookieConsent();
  const [summary, setSummary] = useState<CookieConsentSummary>(() => getConsentSummary());

  useEffect(() => {
    const refresh = () => setSummary(getConsentSummary());
    refresh();

    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, refresh);
  }, []);

  return (
    <section className="rounded-xl border border-border/45 bg-card/35 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
      <h2 className="text-sm font-semibold text-foreground">{content.statusHeading}</h2>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {summary.hasChoice ? (
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="size-4 text-primary" aria-hidden />
            {summary.analytics ? content.statusAnalyticsOn : content.statusAnalyticsOff}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{content.statusNoChoice}</p>
        )}

        <Button type="button" variant="outline" size="sm" onClick={openPreferences}>
          {content.changeSettings}
        </Button>
      </div>
    </section>
  );
}
