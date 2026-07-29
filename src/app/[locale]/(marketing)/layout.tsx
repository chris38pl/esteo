import { auth } from "@clerk/nextjs/server";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export default async function MarketingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "pl";

  setRequestLocale(locale);

  const { userId } = await auth();

  return (
    <MarketingShell locale={locale} isSignedIn={Boolean(userId)}>
      {children}
    </MarketingShell>
  );
}
