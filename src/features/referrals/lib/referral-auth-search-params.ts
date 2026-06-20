const CODE_PATTERN = /^[A-Z0-9]{4,20}$/;

export function normalizeReferralCodeInput(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function isValidReferralCodeFormat(code: string): boolean {
  const normalized = normalizeReferralCodeInput(code);
  return normalized.length >= 4 && normalized.length <= 20 && CODE_PATTERN.test(normalized);
}

export function extractReferralCodeFromRedirectUrl(redirectUrl: string): string | null {
  const trimmed = redirectUrl.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    return extractReferralCodeFromPathname(url.pathname);
  } catch {
    return extractReferralCodeFromPathname(trimmed);
  }
}

function extractReferralCodeFromPathname(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  const rIndex = parts.indexOf("r");
  if (rIndex < 0 || !parts[rIndex + 1]) {
    return null;
  }

  const normalized = normalizeReferralCodeInput(parts[rIndex + 1]);
  return isValidReferralCodeFormat(normalized) ? normalized : null;
}

export function extractReferralCodeFromAuthSearchParams(params: {
  ref?: string | null;
  redirect_url?: string | null;
}): string | null {
  if (params.ref) {
    const normalized = normalizeReferralCodeInput(params.ref);
    if (isValidReferralCodeFormat(normalized)) {
      return normalized;
    }
  }

  if (params.redirect_url) {
    return extractReferralCodeFromRedirectUrl(params.redirect_url);
  }

  return null;
}
