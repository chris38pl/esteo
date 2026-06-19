import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  REFERRAL_COOKIE_MAX_AGE_SECONDS,
  REFERRAL_COOKIE_NAME,
} from "@/features/referrals/lib/referral-cookie";
import {
  canUserGenerateReferrals,
} from "@/features/referrals/server/referral-eligibility";
import {
  isValidReferralCodeFormat,
  resolveReferrerByCode,
} from "@/features/referrals/server/user-referral-profile-service";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export default async function ReferralLandingPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";
  setRequestLocale(resolvedLocale);

  const t = await getTranslations("referrals.publicLink");

  if (!isValidReferralCodeFormat(code)) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <p className="text-muted-foreground">{t("invalid")}</p>
      </main>
    );
  }

  const profile = await resolveReferrerByCode(code);
  if (!profile) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <p className="text-muted-foreground">{t("invalid")}</p>
      </main>
    );
  }

  const canGenerate = await canUserGenerateReferrals(profile.userId);
  if (!canGenerate) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <p className="text-muted-foreground">{t("inactive")}</p>
      </main>
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(REFERRAL_COOKIE_NAME, profile.code, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });

  redirect(`/${resolvedLocale}/sign-up?ref=${encodeURIComponent(profile.code)}`);
}
