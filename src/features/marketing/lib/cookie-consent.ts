export const COOKIE_CONSENT_NAME = "esteo_cookie_consent";
export const COOKIE_CONSENT_MIRROR_KEY = "esteo:cookie-consent";
export const COOKIE_CONSENT_UPDATED_EVENT = "esteo:cookie-consent-updated";
export const COOKIE_CONSENT_VERSION = "1.0";
export const COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  timestamp: string;
  version: string;
};

export type CookieConsentSummary = {
  hasChoice: boolean;
  analytics: boolean | null;
  timestamp: string | null;
  version: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseConsentValue(raw: string | null | undefined): CookieConsent | null {
  if (!raw) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(raw);
    const parsed: unknown = JSON.parse(decoded);

    if (!isRecord(parsed)) {
      return null;
    }

    if (parsed.necessary !== true) {
      return null;
    }

    if (typeof parsed.analytics !== "boolean") {
      return null;
    }

    if (typeof parsed.timestamp !== "string" || typeof parsed.version !== "string") {
      return null;
    }

    return {
      necessary: true,
      analytics: parsed.analytics,
      timestamp: parsed.timestamp,
      version: parsed.version,
    };
  } catch {
    return null;
  }
}

function readCookieValue(cookieSource: string, name: string): string | null {
  const parts = cookieSource.split(";");

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(`${name}=`)) {
      continue;
    }

    return trimmed.slice(name.length + 1);
  }

  return null;
}

export function parseCookieConsent(cookieHeader: string | null | undefined): CookieConsent | null {
  if (!cookieHeader) {
    return null;
  }

  return parseConsentValue(readCookieValue(cookieHeader, COOKIE_CONSENT_NAME));
}

function readLocalStorageMirror(): CookieConsent | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return parseConsentValue(window.localStorage.getItem(COOKIE_CONSENT_MIRROR_KEY));
  } catch {
    return null;
  }
}

export function getCookieConsent(): CookieConsent | null {
  if (typeof document === "undefined") {
    return null;
  }

  const fromCookie = parseConsentValue(readCookieValue(document.cookie, COOKIE_CONSENT_NAME));
  if (fromCookie) {
    return fromCookie;
  }

  return readLocalStorageMirror();
}

export function buildCookieConsent(analytics: boolean): CookieConsent {
  return {
    necessary: true,
    analytics,
    timestamp: new Date().toISOString(),
    version: COOKIE_CONSENT_VERSION,
  };
}

export function setCookieConsent(consent: CookieConsent): void {
  if (typeof document === "undefined") {
    return;
  }

  const encoded = encodeURIComponent(JSON.stringify(consent));
  document.cookie = `${COOKIE_CONSENT_NAME}=${encoded};path=/;max-age=${COOKIE_CONSENT_MAX_AGE};SameSite=Lax`;

  try {
    window.localStorage.setItem(COOKIE_CONSENT_MIRROR_KEY, JSON.stringify(consent));
  } catch {
    // Mirror is optional.
  }
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent()?.analytics === true;
}

export function needsConsentPrompt(consent: CookieConsent | null = getCookieConsent()): boolean {
  if (!consent) {
    return true;
  }

  return consent.version !== COOKIE_CONSENT_VERSION;
}

export function getConsentSummary(consent: CookieConsent | null = getCookieConsent()): CookieConsentSummary {
  if (!consent) {
    return {
      hasChoice: false,
      analytics: null,
      timestamp: null,
      version: null,
    };
  }

  return {
    hasChoice: true,
    analytics: consent.analytics,
    timestamp: consent.timestamp,
    version: consent.version,
  };
}
