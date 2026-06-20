import type { NextRequest, NextResponse } from "next/server";

import { extractReferralCodeFromAuthSearchParams } from "@/features/referrals/lib/referral-auth-search-params";
import {
  REFERRAL_COOKIE_NAME,
  referralCookieSerializeOptions,
} from "@/features/referrals/lib/referral-cookie";

const AUTH_REFERRAL_PATH = /^\/(pl|en)\/(sign-in|sign-up)(\/|$)/;

export function applyReferralAttributionCookie(
  request: NextRequest,
  response: NextResponse,
): void {
  if (!AUTH_REFERRAL_PATH.test(request.nextUrl.pathname)) {
    return;
  }

  const code = extractReferralCodeFromAuthSearchParams({
    ref: request.nextUrl.searchParams.get("ref"),
    redirect_url: request.nextUrl.searchParams.get("redirect_url"),
  });
  if (!code) {
    return;
  }

  const existing = request.cookies.get(REFERRAL_COOKIE_NAME)?.value;
  if (existing === code) {
    return;
  }

  response.cookies.set(REFERRAL_COOKIE_NAME, code, referralCookieSerializeOptions);
}
