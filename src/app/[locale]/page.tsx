import { setRequestLocale } from "next-intl/server";

import { DatabaseUnavailableState } from "@/components/database/database-unavailable-state";
import { HomeDevAuthButton } from "@/features/landing/components/home-dev-auth-button";
import { HomeLandingFloatingControls } from "@/features/landing/components/home-landing-floating-controls";
import { HomeLandingPage } from "@/features/landing/components/home-landing-page";
import { DatabaseUnavailableError } from "@/lib/database/database-unavailable-error";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { getCurrentUser } from "@/server/auth/get-current-user";

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "pl";

  setRequestLocale(locale);

  try {
    await getCurrentUser();
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return (
        <main className="surface-base flex flex-1 items-center justify-center px-6 py-16 font-sans">
          <DatabaseUnavailableState />
        </main>
      );
    }
    throw error;
  }

  return (
    <>
      <HomeLandingFloatingControls locale={locale} />
      {process.env.NODE_ENV === "development" ? <HomeDevAuthButton /> : null}
      <HomeLandingPage locale={locale} />
    </>
  );
}
