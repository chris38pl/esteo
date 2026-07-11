import type { ReactNode } from "react";

import type { Locale } from "@/lib/locale";
import { CookieConsentProvider } from "@/features/marketing/components/cookie-consent";
import { MarketingFooter } from "@/features/marketing/components/marketing-footer";
import { MarketingHeader } from "@/features/marketing/components/marketing-header";

export function MarketingShell({
  children,
  locale,
}: {
  children: ReactNode;
  locale: Locale;
}) {
  return (
    <CookieConsentProvider locale={locale}>
      <div className="dark flex min-h-dvh flex-col bg-background text-foreground">
        <MarketingHeader locale={locale} />
        <main className="flex-1">{children}</main>
        <MarketingFooter locale={locale} />
      </div>
    </CookieConsentProvider>
  );
}
