"use client";

import { MarketingCTA } from "@/features/marketing/components/cta";
import { MarketingUserAvatarButton } from "@/features/marketing/components/marketing-user-avatar-button";
import { useMarketingAuthCta } from "@/features/marketing/lib/use-marketing-auth-cta";
import type { Locale } from "@/lib/locale";

export function MarketingHeaderAuth({
  locale,
  isSignedIn,
}: {
  locale: Locale;
  isSignedIn: boolean;
}) {
  const { copy, appHref } = useMarketingAuthCta(locale);

  if (!isSignedIn) {
    return (
      <MarketingCTA href={`/${locale}/sign-in`} size="sm" className="hidden md:inline-flex">
        {copy.headerSignIn}
      </MarketingCTA>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <MarketingCTA href={appHref} size="sm" className="hidden md:inline-flex">
        {copy.goToApp}
      </MarketingCTA>
      <MarketingUserAvatarButton />
    </div>
  );
}
