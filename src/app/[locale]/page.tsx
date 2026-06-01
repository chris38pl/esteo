import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

import { getServerTranslations } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { DatabaseUnavailableState } from "@/components/database/database-unavailable-state";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { DatabaseUnavailableError } from "@/lib/database/database-unavailable-error";

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "pl";

  setRequestLocale(locale);
  const t = await getServerTranslations(locale, "common");

  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
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
    <main className="surface-base flex flex-1 items-center justify-center px-6 py-16 font-sans">
      <div className="surface-card w-full max-w-xl space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{t("appName")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("localeLabel")}: <span className="font-medium">{locale}</span>
            </p>
          </div>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>

        <SignedOut>
          <p className="text-sm text-muted-foreground">
            {t("home.signInHint")}
          </p>
          <Link
            href={`/${locale}/sign-in`}
            className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            {t("home.signInCta")}
          </Link>
        </SignedOut>

        <SignedIn>
          <div className="space-y-3 text-sm">
            <p>
              {t("home.syncedUser")}:{" "}
              <span className="font-medium">
                {user?.email ?? t("status.syncing")}
              </span>
            </p>
            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex font-medium underline"
            >
              {t("home.goToDashboard")}
            </Link>
          </div>
        </SignedIn>
      </div>
    </main>
  );
}
