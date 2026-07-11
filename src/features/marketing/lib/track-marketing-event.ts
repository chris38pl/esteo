"use client";

import { hasAnalyticsConsent } from "@/features/marketing/lib/cookie-consent";

export type MarketingEventName =
  | "landing_viewed"
  | "hero_cta_clicked"
  | "secondary_cta_clicked"
  | "pricing_cta_clicked"
  | "faq_expanded"
  | "contact_clicked"
  | "security_link_clicked"
  | "footer_link_clicked"
  | "cookie_banner_shown"
  | "cookie_accept_all"
  | "cookie_reject"
  | "cookie_customize"
  | "cookie_preferences_saved";

export type MarketingEventProperties = Record<string, string | boolean | number | undefined>;

const CONSENT_UX_EVENTS = new Set<MarketingEventName>([
  "cookie_banner_shown",
  "cookie_accept_all",
  "cookie_reject",
  "cookie_customize",
  "cookie_preferences_saved",
]);

function isAnalyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MARKETING_ANALYTICS === "true";
}

function shouldGateByConsent(event: MarketingEventName): boolean {
  return !CONSENT_UX_EVENTS.has(event);
}

function emitMarketingEvent(event: MarketingEventName, properties: MarketingEventProperties): void {
  if (process.env.NODE_ENV === "development") {
    console.debug("[marketing]", event, properties);
  }

  if (!isAnalyticsEnabled()) {
    return;
  }

  // Vendor adapter placeholder - wire PostHog/Vercel/etc. when consent UX is ready.
  void event;
  void properties;
}

export function trackCookieConsentEvent(
  event: Extract<
    MarketingEventName,
    | "cookie_banner_shown"
    | "cookie_accept_all"
    | "cookie_reject"
    | "cookie_customize"
    | "cookie_preferences_saved"
  >,
  properties: MarketingEventProperties = {},
): void {
  emitMarketingEvent(event, properties);
}

export function trackMarketingEvent(
  event: MarketingEventName,
  properties: MarketingEventProperties = {},
): void {
  if (shouldGateByConsent(event) && !hasAnalyticsConsent()) {
    return;
  }

  emitMarketingEvent(event, properties);
}
