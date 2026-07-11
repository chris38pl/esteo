"use client";

import { useAuth } from "@clerk/nextjs";

import {
  getMarketingAuthCopy,
  marketingAppHref,
  resolveMarketingPrimaryCta,
} from "@/features/marketing/lib/marketing-auth-ux";
import type { Locale } from "@/lib/locale";

export function useMarketingAuthCta(locale: Locale) {
  const { isSignedIn } = useAuth();
  const signedIn = isSignedIn === true;
  const copy = getMarketingAuthCopy(locale);

  return {
    isSignedIn: signedIn,
    copy,
    appHref: marketingAppHref(locale),
    resolvePrimaryCta: (
      signedOut: { href: string; label: string },
      signedInLabel?: Parameters<typeof resolveMarketingPrimaryCta>[3],
    ) => resolveMarketingPrimaryCta(locale, signedIn, signedOut, signedInLabel),
  };
}
