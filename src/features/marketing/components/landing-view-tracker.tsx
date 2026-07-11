"use client";

import { useEffect } from "react";

import { trackMarketingEvent } from "@/features/marketing/lib/track-marketing-event";
import type { Locale } from "@/lib/locale";

export function LandingViewTracker({ locale }: { locale: Locale }) {
  useEffect(() => {
    trackMarketingEvent("landing_viewed", {
      locale,
      page: "landing",
    });
  }, [locale]);

  return null;
}
