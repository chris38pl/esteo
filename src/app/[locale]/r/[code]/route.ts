import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { referralCookieSerializeOptions, REFERRAL_COOKIE_NAME } from "@/features/referrals/lib/referral-cookie";
import {
  isValidReferralCodeFormat,
  resolveReferrerByCode,
} from "@/features/referrals/server/user-referral-profile-service";
import { isLocale, type Locale } from "@/lib/locale";

function referralErrorHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="pl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Esteo</title>
  </head>
  <body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#060b16;color:#8b9ab7;font-family:system-ui,sans-serif;">
    <main style="max-width:32rem;padding:1rem;text-align:center;">
      <p style="margin:0;font-size:0.875rem;line-height:1.5;">${message}</p>
    </main>
  </body>
</html>`;
}

function referralErrorResponse(message: string, status = 404): NextResponse {
  return new NextResponse(referralErrorHtml(message), {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ locale: string; code: string }> },
) {
  const { locale, code } = await context.params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "referrals.publicLink" });

  if (!isValidReferralCodeFormat(code)) {
    return referralErrorResponse(t("invalid"));
  }

  const profile = await resolveReferrerByCode(code);
  if (!profile) {
    return referralErrorResponse(t("invalid"));
  }

  const redirectUrl = new URL(
    `/${resolvedLocale}/sign-up?ref=${encodeURIComponent(profile.code)}`,
    request.url,
  );
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(REFERRAL_COOKIE_NAME, profile.code, referralCookieSerializeOptions);
  return response;
}
