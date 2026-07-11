"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { appToast } from "@/components/ui/app-toast/show-app-toast";
import { getCookieConsentContent } from "@/features/marketing/content/cookie-consent-content";
import {
  buildCookieConsent,
  COOKIE_CONSENT_UPDATED_EVENT,
  getCookieConsent,
  needsConsentPrompt,
  setCookieConsent,
} from "@/features/marketing/lib/cookie-consent";
import { initializeMarketingAnalytics } from "@/features/marketing/lib/marketing-analytics";
import { trackCookieConsentEvent } from "@/features/marketing/lib/track-marketing-event";
import type { Locale } from "@/lib/locale";

import { CookieConsentBanner } from "./cookie-consent-banner";

export type CookieConsentView = "banner" | "customize";

type CookieConsentContextValue = {
  isOpen: boolean;
  view: CookieConsentView;
  analyticsEnabled: boolean;
  setAnalyticsEnabled: (value: boolean) => void;
  openPreferences: () => void;
  showCustomize: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  saveCustom: () => void;
  handleCustomizeOpenChange: (open: boolean) => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent(): CookieConsentContextValue {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return context;
}

export function CookieConsentProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const content = getCookieConsentContent(locale);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<CookieConsentView>("banner");
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [hasAnnounced, setHasAnnounced] = useState(false);

  const persistConsent = useCallback(
    (analytics: boolean, event: "cookie_accept_all" | "cookie_reject" | "cookie_preferences_saved") => {
      const consent = buildCookieConsent(analytics);
      setCookieConsent(consent);

      if (analytics) {
        initializeMarketingAnalytics();
      }

      trackCookieConsentEvent(event, { analytics });
      appToast.success(`✓ ${content.toastSaved}`, { duration: 1000, position: "bottom-center" });
      window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT));

      setIsOpen(false);
      setView("banner");
    },
    [content.toastSaved],
  );

  const openPreferences = useCallback(() => {
    const existing = getCookieConsent();
    setAnalyticsEnabled(existing?.analytics ?? false);
    setView("customize");
    setIsOpen(true);
  }, []);

  const showCustomize = useCallback(() => {
    trackCookieConsentEvent("cookie_customize");
    setView("customize");
  }, []);

  const acceptAll = useCallback(() => {
    persistConsent(true, "cookie_accept_all");
  }, [persistConsent]);

  const rejectAll = useCallback(() => {
    persistConsent(false, "cookie_reject");
  }, [persistConsent]);

  const saveCustom = useCallback(() => {
    persistConsent(analyticsEnabled, "cookie_preferences_saved");
  }, [analyticsEnabled, persistConsent]);

  const handleCustomizeOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        if (view === "customize" && needsConsentPrompt()) {
          setView("banner");
          return;
        }

        setIsOpen(false);
        setView("banner");
      }
    },
    [view],
  );

  useEffect(() => {
    const existing = getCookieConsent();
    if (needsConsentPrompt(existing)) {
      setAnalyticsEnabled(existing?.analytics ?? false);
      setIsOpen(true);
      setView("banner");
    } else {
      initializeMarketingAnalytics();
    }
  }, []);

  useEffect(() => {
    if (isOpen && view === "banner" && !hasAnnounced) {
      trackCookieConsentEvent("cookie_banner_shown");
      setHasAnnounced(true);
    }
  }, [hasAnnounced, isOpen, view]);

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      isOpen,
      view,
      analyticsEnabled,
      setAnalyticsEnabled,
      openPreferences,
      showCustomize,
      acceptAll,
      rejectAll,
      saveCustom,
      handleCustomizeOpenChange,
    }),
    [
      acceptAll,
      analyticsEnabled,
      handleCustomizeOpenChange,
      isOpen,
      openPreferences,
      rejectAll,
      saveCustom,
      showCustomize,
      view,
    ],
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {isOpen ? <CookieConsentBanner locale={locale} /> : null}
    </CookieConsentContext.Provider>
  );
}
