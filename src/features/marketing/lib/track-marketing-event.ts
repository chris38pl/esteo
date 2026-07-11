"use client";

export type MarketingEventName =
  | "landing_viewed"
  | "hero_cta_clicked"
  | "secondary_cta_clicked"
  | "pricing_cta_clicked"
  | "faq_expanded"
  | "contact_clicked"
  | "security_link_clicked"
  | "footer_link_clicked";

export type MarketingEventProperties = Record<string, string | boolean | number | undefined>;

function isAnalyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MARKETING_ANALYTICS === "true";
}

export function trackMarketingEvent(
  event: MarketingEventName,
  properties: MarketingEventProperties = {},
): void {
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
