"use client";

import { useEffect, useState } from "react";
import { Check, Minus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCookieConsentContent } from "@/features/marketing/content/cookie-consent-content";
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  getConsentSummary,
  type CookieConsentSummary,
} from "@/features/marketing/lib/cookie-consent";
import type { Locale } from "@/lib/locale";

import { useCookieConsent } from "./cookie-consent-provider";

function StatusRow({
  label,
  state,
}: {
  label: string;
  state: "always" | "enabled" | "disabled" | "pending";
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
        {state === "always" || state === "enabled" ? (
          <Check className="size-4 text-primary" aria-hidden />
        ) : state === "disabled" ? (
          <X className="size-4 text-muted-foreground" aria-hidden />
        ) : (
          <Minus className="size-4 text-muted-foreground" aria-hidden />
        )}
        <span className="sr-only">
          {state === "always"
            ? "Always active"
            : state === "enabled"
              ? "Enabled"
              : state === "disabled"
                ? "Disabled"
                : "Pending"}
        </span>
      </span>
    </div>
  );
}

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

  const analyticsState = !summary.hasChoice
    ? "pending"
    : summary.analytics
      ? "enabled"
      : "disabled";

  return (
    <section className="rounded-xl border border-border/45 bg-card/35 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
      <h2 className="text-sm font-semibold text-foreground">{content.statusTitle}</h2>

      <div className="mt-4 space-y-3">
        <StatusRow label={content.statusNecessary} state="always" />
        <StatusRow label={content.statusFunctional} state="always" />
        <StatusRow
          label={
            analyticsState === "enabled"
              ? content.statusAnalyticsEnabled
              : analyticsState === "disabled"
                ? content.statusAnalyticsDisabled
                : content.statusAnalyticsPending
          }
          state={analyticsState}
        />
      </div>

      <div className="mt-4">
        <Button type="button" variant="outline" size="sm" onClick={openPreferences}>
          {content.changeSettings}
        </Button>
      </div>
    </section>
  );
}
