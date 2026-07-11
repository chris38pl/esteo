import { hasAnalyticsConsent } from "@/features/marketing/lib/cookie-consent";

let initialized = false;

export function initializeMarketingAnalytics(): void {
  if (initialized || typeof window === "undefined") {
    return;
  }

  if (!hasAnalyticsConsent()) {
    return;
  }

  initialized = true;

  // Vendor adapter placeholder - wire PostHog / GA4 / GTM / Clarity when ready.
}
